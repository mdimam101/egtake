import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SummaryApi from "../common/SummaryApi";
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

const useProductCards = ({
  enabled = true,
  updateStore = true,
  cacheHome = false,
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
  const productRevisionRef = useRef(0);
  const lifecycleRef = useRef(0);
  const paginationRef = useRef(INITIAL_PAGINATION);
  const requestRef = useRef(null);
  const mountedRef = useRef(false);
  const initializingRef = useRef(false);
  const backgroundRefreshRef = useRef(null);

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

        const result = response.data;
        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || "Unable to load products");
        }

        const hasMore = Boolean(result.pagination?.hasMore);
        const nextPage = hasMore ? result.pagination?.nextPage : null;
        if (hasMore && (!Number.isSafeInteger(nextPage) || nextPage <= page)) {
          throw new Error("Unable to load the next product page");
        }

        const cards = normalizeProductCards(result.data);
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
          void writeHomeProductPage({
            data: result.data,
            pagination: result.pagination,
          });
        }
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
          }
        }
      }
    },
    [dispatch, shouldCacheHome, updateStore],
  );

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
      backgroundRefreshRef.current = null;
    };
  }, [dispatch, enabled, fetchProductPage, shouldCacheHome]);

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
      return fetchPageAfterImages(nextPage, signal);
    },
    [fetchPageAfterImages],
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
