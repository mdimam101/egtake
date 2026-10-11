import axios, { isCancel } from "axios";
import { useCallback, useEffect, useState } from "react";
import SummaryApi from "../common/SummaryApi";
import { generateOptimizedVariants } from "../helper/variantUtils";

const EMPTY_PRODUCTS = [];

// Category views fetch their own products rather than relying on a complete
// homepage catalog. The homepage card endpoint does not include category.
export default function useCategoryProducts(category) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [result, setResult] = useState({
    category: null,
    requestVersion: 0,
    products: EMPTY_PRODUCTS,
    error: null,
  });

  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!category) return undefined;

    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        const response = await axios({
          url: SummaryApi.category_wish_product.url,
          method: SummaryApi.category_wish_product.method,
          headers: {
            "x-client-key": process.env.EXPO_PUBLIC_CLIENT_KEY,
            "content-type": "application/json",
          },
          data: { category },
          signal: controller.signal,
        });

        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error(
            response.data?.message || "Unable to fetch category products",
          );
        }

        if (!controller.signal.aborted) {
          setResult({
            category,
            requestVersion,
            products: generateOptimizedVariants(response.data.data),
            error: null,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted && !isCancel(error)) {
          setResult({
            category,
            requestVersion,
            products: EMPTY_PRODUCTS,
            error: error.message || "Unable to fetch category products",
          });
        }
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [category, requestVersion]);

  const isCurrentCategory =
    result.category === category && result.requestVersion === requestVersion;
  return {
    products: category && isCurrentCategory ? result.products : EMPTY_PRODUCTS,
    loading: Boolean(category && !isCurrentCategory),
    error: category && isCurrentCategory ? result.error : null,
    refetch,
  };
}
