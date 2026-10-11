import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import {
    readHomeTrendingProducts,
    writeHomeTrendingProducts,
} from "../helper/homeProductCache";
import { normalizeProductCards } from "../helper/productCards";
import { setTrendingList } from "../store/trendingSlice";

const toTrendingCards = (products) =>
  normalizeProductCards(products).sort(
    (a, b) => (b.createdTs || 0) - (a.createdTs || 0),
  );

export default function useTrendingProducts({ cacheHome = false } = {}) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(null);
  const initializingRef = useRef(false);

  const fetchTrendingProducts = useCallback(
    async ({ silent = false } = {}) => {
      if (!mountedRef.current || initializingRef.current || requestRef.current)
        return false;

      const controller = new AbortController();
      requestRef.current = controller;
      if (!silent) setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          SummaryApi.trending_product_cards.url,
          {
            headers: { "x-client-key": process.env.EXPO_PUBLIC_CLIENT_KEY },
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted || !mountedRef.current) return false;

        const result = response.data;
        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error("Unable to load trending products");
        }

        dispatch(setTrendingList(toTrendingCards(result.data)));
        if (cacheHome) void writeHomeTrendingProducts(result.data);
        return true;
      } catch (_requestError) {
        if (!silent && !controller.signal.aborted && mountedRef.current) {
          setError("Could not load trending products. Please try again.");
        }
        return false;
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          if (!controller.signal.aborted && mountedRef.current)
            setLoading(false);
        }
      }
    },
    [cacheHome, dispatch],
  );

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    initializingRef.current = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      const cached = cacheHome ? await readHomeTrendingProducts() : null;
      if (!active) return;
      if (cached) {
        dispatch(setTrendingList(toTrendingCards(cached)));
        setLoading(false);
      }
      initializingRef.current = false;
      fetchTrendingProducts({ silent: Boolean(cached) });
    });
    return () => {
      active = false;
      mountedRef.current = false;
      initializingRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [cacheHome, dispatch, fetchTrendingProducts]);

  return { loading, error, retry: fetchTrendingProducts };
}
