import axios from "axios";
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import ensureHttps from "../common/ensureHttps";
import {
  readHomeProductPage,
  writeHomeProductPage,
} from "../helper/homeProductCache";
import {
  mergeProductCards,
  normalizeProductCards,
} from "../helper/productCards";
import {
  appendAllProductList,
  setAllProductList,
} from "../store/allProductSlice";

const INITIAL_PAGINATION = { hasMore: false, nextPage: null };
const IMAGE_PREFETCH_CONCURRENCY = 4;

const parseProductPage = (response, page) => {
  const result = response.data;
  if (!result?.success || !Array.isArray(result.data)) {
    throw new Error(result?.message || "Unable to load products");
  }

  const hasMore = Boolean(result.pagination?.hasMore);
  const nextPage = hasMore ? result.pagination?.nextPage : null;
  if (hasMore && (!Number.isSafeInteger(nextPage) || nextPage <= page)) {
    throw new Error("Unable to load the next product page");
  }

  return {
    page,
    cards: normalizeProductCards(result.data),
    data: result.data,
    rawPagination: result.pagination,
    hasMore,
    nextPage,
  };
};

const getCardImageUrl = (card) => {
  const url = ensureHttps(
    card?.img || card?.variants?.[0]?.images?.[0] || null,
  );
  return typeof url === "string" && url ? url : null;
};

// Download one future page to Expo Image's memory/disk cache, then read each
// decoded image's dimensions from that cache. Broken images do not block the
// rest of the page from becoming available.
const prepareProductImages = async (cards, isActive) => {
  const urls = Array.from(new Set(cards.map(getCardImageUrl).filter(Boolean)));
  if (urls.length === 0) return cards;

  const aspectRatios = new Map();
  let cursor = 0;

  const worker = async () => {
    while (cursor < urls.length && isActive()) {
      const url = urls[cursor++];
      try {
        await ExpoImage.prefetch(url, "memory-disk");
        if (!isActive()) return;

        const image = await ExpoImage.loadAsync(url);
        const width = Number(image?.width);
        const height = Number(image?.height);
        if (width > 0 && height > 0) {
          aspectRatios.set(url, width / height);
        }
      } catch {
        // A failed product image should not make the whole product page fail.
      }
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(IMAGE_PREFETCH_CONCURRENCY, urls.length),
      },
      worker,
    ),
  );

  if (!isActive()) return null;
  return cards.map((card) => {
    const imageAspectRatio = aspectRatios.get(getCardImageUrl(card));
    return imageAspectRatio ? { ...card, imageAspectRatio } : card;
  });
};

const useProductCards = ({
  enabled = true,
  updateStore = true,
  cacheHome = false,
  prefetchNextPage = false,
  beforeLoadMore,
} = {}) => {
  const shouldCacheHome = cacheHome && updateStore;
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [productRevision, setProductRevision] = useState(0);
  const [requestRevision, setRequestRevision] = useState(0);
  const productRevisionRef = useRef(0);
  const lifecycleRef = useRef(0);
  const paginationRef = useRef(INITIAL_PAGINATION);
  const requestRef = useRef(null);
  const prefetchRequestRef = useRef(null);
  const prefetchedPageRef = useRef(null);
  const mountedRef = useRef(false);
  const initializingRef = useRef(false);
  const backgroundRefreshRef = useRef(null);

  const clearPrefetchedPage = useCallback(() => {
    prefetchRequestRef.current?.controller.abort();
    prefetchRequestRef.current = null;
    prefetchedPageRef.current = null;
  }, []);

  const commitProductPage = useCallback(
    (pageResult) => {
      const { page, cards, data, rawPagination, hasMore, nextPage } =
        pageResult;

      if (page === 1) clearPrefetchedPage();
      if (updateStore) {
        dispatch(
          page === 1 ? setAllProductList(cards) : appendAllProductList(cards),
        );
      } else {
        setProducts((current) =>
          mergeProductCards(page === 1 ? [] : current, cards),
        );
      }

      productRevisionRef.current += 1;
      setProductRevision(productRevisionRef.current);
      paginationRef.current = { hasMore, nextPage };
      setPagination(paginationRef.current);

      if (shouldCacheHome && page === 1) {
        void writeHomeProductPage({ data, pagination: rawPagination });
      }
    },
    [clearPrefetchedPage, dispatch, shouldCacheHome, updateStore],
  );

  const fetchProductPage = useCallback(
    async (page, { silent = false } = {}) => {
      if (!mountedRef.current || initializingRef.current || requestRef.current)
        return false;
      if (
        page !== 1 &&
        (!paginationRef.current.hasMore ||
          paginationRef.current.nextPage !== page)
      )
        return false;

      const controller = new AbortController();
      requestRef.current = controller;
      setError(null);
      if (page === 1) {
        if (!silent) setLoading(true);
      } else setLoadingMore(true);

      try {
        const response = await axios.get(SummaryApi.product_cards.url, {
          params: { page },
          headers: { "x-client-key": process.env.EXPO_PUBLIC_CLIENT_KEY },
          signal: controller.signal,
        });
        if (controller.signal.aborted || !mountedRef.current) return false;

        commitProductPage(parseProductPage(response, page));
        return true;
      } catch (_requestError) {
        if (!silent && !controller.signal.aborted && mountedRef.current) {
          setError({
            page,
            message: "Could not load products. Please try again.",
          });
        }
        return false;
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          if (!controller.signal.aborted && mountedRef.current) {
            setLoading(false);
            setLoadingMore(false);
            setRequestRevision((revision) => revision + 1);
          }
        }
      }
    },
    [commitProductPage],
  );

  const prefetchProductPage = useCallback((page) => {
    if (
      !mountedRef.current ||
      initializingRef.current ||
      !paginationRef.current.hasMore ||
      paginationRef.current.nextPage !== page
    ) {
      return Promise.resolve(false);
    }

    if (prefetchedPageRef.current?.page === page) {
      return Promise.resolve(true);
    }
    if (prefetchRequestRef.current?.page === page) {
      return prefetchRequestRef.current.promise;
    }

    prefetchRequestRef.current?.controller.abort();
    prefetchedPageRef.current = null;

    const controller = new AbortController();
    const lifecycle = lifecycleRef.current;
    const request = { page, controller, promise: null };
    const isActive = () =>
      mountedRef.current &&
      !controller.signal.aborted &&
      lifecycleRef.current === lifecycle &&
      paginationRef.current.hasMore &&
      paginationRef.current.nextPage === page;

    request.promise = (async () => {
      try {
        const response = await axios.get(SummaryApi.product_cards.url, {
          params: { page },
          headers: { "x-client-key": process.env.EXPO_PUBLIC_CLIENT_KEY },
          signal: controller.signal,
        });
        if (!isActive()) return false;

        const pageResult = parseProductPage(response, page);
        const cards = await prepareProductImages(pageResult.cards, isActive);
        if (!cards || !isActive()) return false;

        prefetchedPageRef.current = { ...pageResult, cards };
        return true;
      } catch {
        return false;
      } finally {
        if (prefetchRequestRef.current === request) {
          prefetchRequestRef.current = null;
        }
      }
    })();

    prefetchRequestRef.current = request;
    return request.promise;
  }, []);
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    lifecycleRef.current += 1;
    mountedRef.current = true;
    initializingRef.current = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      const cached = shouldCacheHome ? await readHomeProductPage() : null;
      if (!active) return;

      if (cached) {
        dispatch(setAllProductList(normalizeProductCards(cached.data)));
        productRevisionRef.current += 1;
        setProductRevision(productRevisionRef.current);
        paginationRef.current = {
          hasMore: cached.pagination.hasMore,
          nextPage: cached.pagination.nextPage,
        };
        setPagination(paginationRef.current);
        setLoading(false);
      }
      initializingRef.current = false;
      const promise = fetchProductPage(1, { silent: Boolean(cached) });
      if (cached) {
        const refresh = { promise, controller: requestRef.current };
        backgroundRefreshRef.current = refresh;
        await promise;
        if (backgroundRefreshRef.current === refresh)
          backgroundRefreshRef.current = null;
      }
    });
    return () => {
      active = false;
      lifecycleRef.current += 1;
      mountedRef.current = false;
      initializingRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
      clearPrefetchedPage();
      backgroundRefreshRef.current = null;
    };
  }, [
    clearPrefetchedPage,
    dispatch,
    enabled,
    fetchProductPage,
    shouldCacheHome,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !prefetchNextPage ||
      initializingRef.current ||
      requestRef.current ||
      backgroundRefreshRef.current
    ) {
      return;
    }

    const { hasMore, nextPage } = paginationRef.current;
    if (!hasMore || !nextPage) {
      clearPrefetchedPage();
      return;
    }

    void prefetchProductPage(nextPage);
  }, [
    clearPrefetchedPage,
    enabled,
    pagination,
    prefetchNextPage,
    prefetchProductPage,
    productRevision,
    requestRevision,
  ]);
  const fetchPageAfterImages = useCallback(
    async (page, signal) => {
      const lifecycle = lifecycleRef.current;
      if (!mountedRef.current || signal?.aborted) return false;
      if (beforeLoadMore) {
        const ready = await beforeLoadMore(productRevisionRef.current, signal);
        if (!ready) return false;
      }
      if (
        !mountedRef.current ||
        signal?.aborted ||
        lifecycleRef.current !== lifecycle
      )
        return false;
      const result = await fetchProductPage(page);
      return !signal?.aborted && result;
    },
    [beforeLoadMore, fetchProductPage],
  );

  const loadMore = useCallback(
    async ({ signal } = {}) => {
      const lifecycle = lifecycleRef.current;
      if (!mountedRef.current || signal?.aborted) return false;
      // Keep scroll demand while the cached first page refreshes in the background.
      const refresh = backgroundRefreshRef.current;
      if (refresh) {
        await refresh.promise;
        if (
          refresh.controller?.signal.aborted ||
          !mountedRef.current ||
          signal?.aborted ||
          lifecycleRef.current !== lifecycle
        )
          return false;
      }
      const { hasMore, nextPage } = paginationRef.current;
      if (!hasMore || !nextPage) return false;

      if (prefetchNextPage) {
        const pending = prefetchRequestRef.current;
        if (pending?.page === nextPage) {
          setLoadingMore(true);
          try {
            await pending.promise;
          } finally {
            if (mountedRef.current) setLoadingMore(false);
          }
        }

        if (
          !mountedRef.current ||
          signal?.aborted ||
          lifecycleRef.current !== lifecycle ||
          paginationRef.current.nextPage !== nextPage
        ) {
          return false;
        }

        const prefetched = prefetchedPageRef.current;
        if (prefetched?.page === nextPage) {
          if (beforeLoadMore) {
            const ready = await beforeLoadMore(
              productRevisionRef.current,
              signal,
            );
            if (!ready || signal?.aborted || !mountedRef.current) return false;
          }

          prefetchedPageRef.current = null;
          commitProductPage(prefetched);
          return true;
        }
      }

      return fetchPageAfterImages(nextPage, signal);
    },
    [beforeLoadMore, commitProductPage, fetchPageAfterImages, prefetchNextPage],
  );

  const retry = useCallback(
    () =>
      error?.page > 1 ? fetchPageAfterImages(error.page) : fetchProductPage(1),
    [error, fetchPageAfterImages, fetchProductPage],
  );

  return {
    products,
    loading: enabled && loading,
    loadingMore: enabled && loadingMore,
    error,
    pagination,
    productRevision,
    loadMore,
    retry,
  };
};

export default useProductCards;
