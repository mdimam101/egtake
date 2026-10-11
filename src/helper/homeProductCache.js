import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUCT_PAGE_KEY = "homeProductCardsPage1V1";
const TRENDING_KEY = "homeTrendingProductCardsV1";
const CACHE_VERSION = 1;
const PAGE_SIZE = 15;
const pendingWrites = new Map();

const isValidId = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isCompactVariant = (variant) =>
  variant !== null &&
  typeof variant === "object" &&
  !Array.isArray(variant) &&
  isValidId(variant._id) &&
  (variant.firstImage === null ||
    (typeof variant.firstImage === "string" &&
      variant.firstImage.trim().length > 0)) &&
  Number.isFinite(variant.stock) &&
  variant.stock >= 0;

const isProductArray = (products) =>
  Array.isArray(products) &&
  products.every(
    (product) =>
      product !== null &&
      typeof product === "object" &&
      !Array.isArray(product) &&
      isValidId(product._id) &&
      Array.isArray(product.variants) &&
      product.variants.every(isCompactVariant),
  );

const isFirstProductPage = (page) =>
  page !== null &&
  typeof page === "object" &&
  isProductArray(page.data) &&
  page.data.length <= PAGE_SIZE &&
  page.pagination?.page === 1 &&
  page.pagination.limit === PAGE_SIZE &&
  typeof page.pagination.hasMore === "boolean" &&
  page.pagination.nextPage === (page.pagination.hasMore ? 2 : null);

// Serialize before queuing so later mutations cannot change a pending write.
// Each cache key writes in call order, even when storage completes slowly.
const writeCache = (key, cache) => {
  let serialized;
  try {
    serialized = JSON.stringify(cache);
  } catch {
    return Promise.resolve(false);
  }

  const previousWrite = pendingWrites.get(key) || Promise.resolve();
  const write = previousWrite
    .then(() => AsyncStorage.setItem(key, serialized))
    .then(
      () => true,
      () => false,
    );
  pendingWrites.set(key, write);

  return write.finally(() => {
    if (pendingWrites.get(key) === write) pendingWrites.delete(key);
  });
};

export async function readHomeProductPage() {
  try {
    const serialized = await AsyncStorage.getItem(PRODUCT_PAGE_KEY);
    if (!serialized) return null;
    const cached = JSON.parse(serialized);
    if (cached?.version !== CACHE_VERSION || !isFirstProductPage(cached)) {
      return null;
    }
    return { data: cached.data, pagination: cached.pagination };
  } catch {
    return null;
  }
}

export async function writeHomeProductPage(page) {
  if (!isFirstProductPage(page)) return false;
  return writeCache(PRODUCT_PAGE_KEY, {
    version: CACHE_VERSION,
    data: page.data,
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      hasMore: page.pagination.hasMore,
      nextPage: page.pagination.nextPage,
    },
  });
}

export async function readHomeTrendingProducts() {
  try {
    const serialized = await AsyncStorage.getItem(TRENDING_KEY);
    if (!serialized) return null;
    const cached = JSON.parse(serialized);
    if (cached?.version !== CACHE_VERSION || !isProductArray(cached.data)) {
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export async function writeHomeTrendingProducts(products) {
  if (!isProductArray(products)) return false;
  return writeCache(TRENDING_KEY, {
    version: CACHE_VERSION,
    data: products,
  });
}
