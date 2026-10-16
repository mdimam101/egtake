import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  InteractionManager,
  Image as RNImage,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ensureHttps from "../common/ensureHttps";
import BannerSlider from "../components/BannerSlider";
import CategoryListBar from "../components/CategoryListBar";
import SearchBar, { SupportSheet } from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard";
import SkeletonSlideCard from "../components/SkeletonSlideCard";
import UserProductCart from "../components/UserProductCart";
import UserSlideProductCard from "../components/UserSlideProductCard";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";
import useCategoryProducts from "../helper/useCategoryProducts";
import useProductCards from "../hooks/useProductCards";
import useTrendingProducts from "../hooks/useTrendingProducts";
import { setHandCraftList } from "../store/handCraftSlice";
import { setSalesList } from "../store/salesSlice"; // ✅ KEEP: Sales slice
import { setUnder99List } from "../store/under99Slice";

const RENDER_BATCH_SIZE = 24;

// Home sliders show one representative card per product. The full category
// views intentionally keep every optimized variant, just like the For You grid.
const uniqueProductsById = (products = []) => {
  const seen = new Set();
  return products.filter((product) => {
    if (!product?._id || seen.has(product._id)) return false;
    seen.add(product._id);
    return true;
  });
};

// Home Page
const HomePage = () => {
  const {
    loading,
    loadingMore,
    error: productError,
    pagination,
    loadMore,
    retry: retryProducts,
  } = useProductCards({ cacheHome: true, prefetchNextPage: true });
  const {
    loading: trendingLoading,
    error: trendingError,
    retry: retryTrending,
  } = useTrendingProducts({ cacheHome: true });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const isTrendingCategory = selectedCategory === "_trending";
  const isRegularCategory = Boolean(
    selectedCategory && !selectedCategory.startsWith("_"),
  );
  const {
    products: categoryProducts,
    loading: categoryLoading,
    error: categoryError,
    refetch: retryCategory,
  } = useCategoryProducts(isRegularCategory ? selectedCategory : null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [prevCategory, setPrevCategory] = useState(null);
  const [interestSorted, setInterestSorted] = useState({
    source: null,
    products: [],
  });
  const [pressedIds, setPressedIds] = useState({});

  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH_SIZE);
  const scrollRefforFlatList = useRef();

  const catListRef = useRef(null); // ✅ category FlatList ref
  const [catListKey, setCatListKey] = useState(0); // ✅ remount trigger key

  // Trending 2-phase
  const [trendingPhase, setTrendingPhase] = useState([]); // first 6
  const [trendingAll, setTrendingAll] = useState([]); // full list next tick

  // Under99 2-phase
  const [underPhase, setUnderPhase] = useState([]); // first 6
  const [underAll, setUnderAll] = useState([]); // full list next tick

  // HandCraft 2-phase
  const [handPhase, setHandPhase] = useState([]);
  const [handAll, setHandAll] = useState([]);

  // ✅ KEEP: Sales 2-phase (no timer)
  const [salesPhase, setSalesPhase] = useState([]);
  const [salesAll, setSalesAll] = useState([]);

  // ✅ KEEP: UI flag for showing Sales section (no countdown)
  const [showSalesSlide, setShowSalesSlide] = useState(false);

  const optimizedProducts = useSelector((s) => s.productState.productList);
  const sortedProducts =
    interestSorted.source === optimizedProducts
      ? interestSorted.products
      : optimizedProducts;
  const trendingFromStore = useSelector((s) => s.trendingState.trendingList);
  const under99FromStore = useSelector((s) => s.under99State.under99List);
  const handFromStore = useSelector((s) => s.handCraftState.handCraftList);
  const salesFromStore = useSelector((s) => s.salesState.salesList);
  const dispatch = useDispatch();

  const commonInfo = useSelector((s) => s.commonState.commonInfoList);

  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    const newestFirst = (cards) =>
      cards.sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
    dispatch(
      setHandCraftList(
        uniqueProductsById(
          newestFirst(optimizedProducts.filter((product) => product.handCraft)),
        ),
      ),
    );
    dispatch(
      setSalesList(
        newestFirst(optimizedProducts.filter((product) => product.salesOn)),
      ),
    );
    dispatch(
      setUnder99List(
        newestFirst(
          optimizedProducts.filter(
            (product) => (product.selling ?? Infinity) <= 199,
          ),
        ),
      ),
    );
  }, [dispatch, optimizedProducts]);

  // ✅ KEEP: store hydrated → instantly show section
  useEffect(() => {
    if (salesFromStore && salesFromStore.length > 0) {
      setShowSalesSlide((prev) => prev || true);
    }
  }, [salesFromStore]);

  // ============== IMAGE PREFETCH HELPERS ==============
  const serialPrefetch = async (urls = []) => {
    for (const u of urls) {
      if (!u) continue;
      try {
        await RNImage.prefetch(ensureHttps(u));
      } catch {}
    }
  };

  const priorityPreloadSlide = async (products = [], take = 6) => {
    const imgs = products
      .slice(0, take)
      .map((p) => ensureHttps(p?.img))
      .filter(Boolean);

    // priority serial
    await serialPrefetch(imgs);

    // rest background
    InteractionManager.runAfterInteractions(() => {
      const rest = products
        .slice(take, 30)
        .map((p) => ensureHttps(p?.img))
        .filter(Boolean);
      rest.forEach((u) => RNImage.prefetch(u));
    });
  };

  // ============== SORT BY USER INTEREST (BACKGROUND) ==============
  useEffect(() => {
    let alive = true;
    const task = InteractionManager.runAfterInteractions(() =>
      sortProductsByUserInterest(optimizedProducts).then((products) => {
        if (alive) setInterestSorted({ source: optimizedProducts, products });
      }),
    );
    return () => {
      alive = false;
      task.cancel?.();
    };
  }, [optimizedProducts]);

  // Trending 2-phase
  useEffect(() => {
    if (!trendingFromStore || trendingFromStore.length === 0) {
      setTrendingPhase([]);
      setTrendingAll([]);
      return;
    }
    const first6 = trendingFromStore.slice(0, 6);
    setTrendingPhase(first6);
    setTrendingAll([]);
    const id = setTimeout(() => setTrendingAll(trendingFromStore), 0);
    return () => clearTimeout(id);
  }, [trendingFromStore]);

  // Under99 2-phase
  useEffect(() => {
    if (!under99FromStore || under99FromStore.length === 0) {
      setUnderPhase([]);
      setUnderAll([]);
      return;
    }
    const first6 = under99FromStore.slice(0, 6);
    setUnderPhase(first6);
    setUnderAll([]);
    const id = setTimeout(() => setUnderAll(under99FromStore), 0);
    return () => clearTimeout(id);
  }, [under99FromStore]);

  // HandCraft 2-phase
  useEffect(() => {
    if (!handFromStore || handFromStore.length === 0) {
      setHandPhase([]);
      setHandAll([]);
      return;
    }
    const first6 = handFromStore.slice(0, 6);
    setHandPhase(first6);
    setHandAll([]);
    const id = setTimeout(() => setHandAll(handFromStore), 0);
    return () => clearTimeout(id);
  }, [handFromStore]);

  // ✅ KEEP: Sales 2-phase
  useEffect(() => {
    if (!salesFromStore || salesFromStore.length === 0) {
      setSalesPhase([]);
      setSalesAll([]);
      return;
    }
    const first6 = salesFromStore.slice(0, 6);
    setSalesPhase(first6);
    setSalesAll([]);
    const id = setTimeout(() => setSalesAll(salesFromStore), 0);
    return () => clearTimeout(id);
  }, [salesFromStore]);

  // Prefetch images for top-of-sections
  useEffect(() => {
    if (
      trendingPhase.length === 0 &&
      underPhase.length === 0 &&
      handPhase.length === 0 &&
      salesPhase.length === 0
    )
      return;
    const jobs = [];
    if (trendingPhase.length) jobs.push(priorityPreloadSlide(trendingPhase, 6));
    if (underPhase.length) jobs.push(priorityPreloadSlide(underPhase, 6));
    if (handPhase.length) jobs.push(priorityPreloadSlide(handPhase, 6));
    if (salesPhase.length) jobs.push(priorityPreloadSlide(salesPhase, 6));
    Promise.allSettled(jobs);
  }, [trendingPhase, underPhase, handPhase, salesPhase]);

  // ============== CLICK GUARD & FOCUS ==============
  useFocusEffect(
    useCallback(() => {
      setPressedIds({});
      return () => {};
    }, []),
  );

  const pressGuard = useCallback(
    (id) => {
      if (!id) return true;
      if (pressedIds[id]) return false;
      setPressedIds((prev) => ({ ...prev, [id]: true }));
      return true;
    },
    [pressedIds],
  );

  // ============== DERIVED LISTS ==============
  const trendingProducts = trendingAll.length ? trendingAll : trendingPhase;
  const under99Products = underAll.length ? underAll : underPhase;
  const handProducts = handAll.length ? handAll : handPhase;
  const salesProducts = salesAll.length ? salesAll : salesPhase;

  const filteredProducts = selectedCategory
    ? selectedCategory === "_trending"
      ? trendingFromStore
      : selectedCategory === "_below99"
        ? under99FromStore
        : selectedCategory === "_handcraft"
          ? handFromStore
          : selectedCategory === "_sales"
            ? salesFromStore
            : categoryProducts
    : sortedProducts;

  const totalLength = selectedCategory
    ? filteredProducts.length
    : sortedProducts.length;

  const memoFiltered = useMemo(() => {
    return selectedCategory
      ? filteredProducts.slice(0, visibleCount)
      : sortedProducts.slice(0, visibleCount);
  }, [selectedCategory, filteredProducts, sortedProducts, visibleCount]);

  // Memoize left/right split for masonry layout
  const memoSplit = useMemo(() => {
    return {
      left: memoFiltered.filter((_, idx) => idx % 2 === 0),
      right: memoFiltered.filter((_, idx) => idx % 2 !== 0),
    };
  }, [memoFiltered]);

  // Reveal buffered cards first, then request only the next server page.
  const endLock = useRef(false);
  const hasRemoteMore = Boolean(
    !isRegularCategory &&
    !isTrendingCategory &&
    pagination.hasMore &&
    pagination.nextPage,
  );
  const handleEndReached = useCallback(async () => {
    // The complete trending response is already loaded; reveal local cards only.
    if (isTrendingCategory) {
      if (!trendingLoading && !trendingError && visibleCount < totalLength) {
        setVisibleCount((count) =>
          Math.min(count + RENDER_BATCH_SIZE, totalLength),
        );
      }
      return;
    }

    if (
      endLock.current ||
      loading ||
      loadingMore ||
      categoryLoading ||
      (isRegularCategory ? categoryError : productError)
    )
      return;

    if (visibleCount < totalLength) {
      endLock.current = true;
      setVisibleCount((count) =>
        Math.min(count + RENDER_BATCH_SIZE, totalLength),
      );
      requestAnimationFrame(() => {
        endLock.current = false;
      });
    } else if (hasRemoteMore) {
      endLock.current = true;
      try {
        if (await loadMore())
          setVisibleCount((count) => count + RENDER_BATCH_SIZE);
      } finally {
        endLock.current = false;
      }
    }
  }, [
    categoryError,
    categoryLoading,
    hasRemoteMore,
    isRegularCategory,
    isTrendingCategory,
    loadMore,
    loading,
    loadingMore,
    productError,
    totalLength,
    trendingError,
    trendingLoading,
    visibleCount,
  ]);

  const loadError = isTrendingCategory
    ? trendingError
    : isRegularCategory
      ? categoryError
      : productError;
  const renderRequestError = (requestError, retry) => (
    <View style={{ padding: 15, alignItems: "center" }}>
      <Text>
        {typeof requestError === "string" ? requestError : requestError.message}
      </Text>
      <TouchableOpacity
        onPress={retry}
        style={{ padding: 12 }}
        accessibilityRole="button"
      >
        <Text style={{ color: "#e91e63", fontWeight: "600" }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
  const renderListFooter = () => {
    if (loadError) {
      return renderRequestError(
        loadError,
        isTrendingCategory
          ? retryTrending
          : isRegularCategory
            ? retryCategory
            : retryProducts,
      );
    }
    if (isTrendingCategory ? trendingLoading : loadingMore || categoryLoading) {
      return <ActivityIndicator color="#e91e63" style={{ padding: 15 }} />;
    }
    if (!loading && hasRemoteMore && totalLength === 0) {
      return (
        <TouchableOpacity
          onPress={handleEndReached}
          accessibilityRole="button"
          style={{ padding: 15, alignItems: "center" }}
        >
          <Text style={{ color: "#e91e63" }}>Load more products</Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ height: 8 }} />;
  };

  // ============== RENDERERS ==============
  const commonKeyExtractor = (item, index) =>
    item?.cardKey
      ? item.cardKey
      : item?._id
        ? `${item._id}::${item?.img || ""}::${item?.variantColor || ""}::${
            item?.variantSize || ""
          }::${index}`
        : `last_${index}`;

  const renderSlide = (rawName) => {
    // ছোট alias, চাইলে এটা বাদও দিতে পারো যদি সবসময় ঠিক key পাঠাও
    const slideName = rawName === "tranding" ? "trending" : rawName;

    const targetSlide =
      slideName === "salesSlide"
        ? salesProducts
        : slideName === "handCraft"
          ? handProducts
          : slideName === "trending"
            ? trendingProducts
            : slideName === "under99"
              ? under99Products
              : null;

    const selectCat =
      slideName === "salesSlide"
        ? "_sales"
        : slideName === "handCraft"
          ? "_handcraft"
          : slideName === "trending"
            ? "_trending"
            : slideName === "under99"
              ? "_below99"
              : null;

    if (slideName === "trending" ? trendingLoading : loading) {
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonSlideCard key={i} />
          ))}
        </View>
      );
    }

    if (slideName === "trending" && trendingError) {
      return renderRequestError(trendingError, retryTrending);
    }

    if (!targetSlide || !selectCat) return null;

    // A compact slider keeps only the first/main variant of each product.
    // The source stored in Redux remains variant-complete for View More.
    const limitedList = uniqueProductsById(targetSlide).slice(0, 4);
    const displayList = [...limitedList, { isLast: true }];

    return (
      <FlatList
        style={{ paddingLeft: 5 }}
        data={displayList}
        initialNumToRender={3} // ← সবগুলোর জন্য 3 একদম OK
        maxToRenderPerBatch={3}
        windowSize={2}
        updateCellsBatchingPeriod={50}
        // removeClippedSubviews
        renderItem={({ item }) => (
          <UserSlideProductCard
            productData={item.isLast ? undefined : item} // last-card safe
            isLast={!!item.isLast}
            onViewMorePress={() => setSelectedCategory(selectCat)}
            disabled={item.isLast ? false : !!pressedIds[item._id]}
            pressGuard={item.isLast ? undefined : pressGuard}
          />
        )}
        // ✅ তোমার extractor থাকলেই যথেষ্ট—fallback already আছে
        keyExtractor={commonKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    );
  };

  // ============== ANIMATION & SCROLL ==============
  useEffect(() => {
    const isGoingBackToAll = !selectedCategory && prevCategory;
    const isGoingToCategory = selectedCategory && !prevCategory;

    if (prevCategory === null && selectedCategory === null) return;

    if (isGoingBackToAll) slideAnim.setValue(-350);
    else if (isGoingToCategory || selectedCategory) slideAnim.setValue(350);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setPrevCategory(selectedCategory);
  }, [selectedCategory, prevCategory, slideAnim]);

  const scrollToTop = () => {
    if (scrollRefforFlatList.current) {
      scrollRefforFlatList.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      // re-mount করতে key বাড়ান (পুরনো offset মুছে যাবে)
      setCatListKey((k) => k + 1);

      // সেফটি: একই ইনস্ট্যান্স থাকলেও টপে স্ক্রল করুন
      requestAnimationFrame(() => {
        catListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      });
    }
    scrollToTop();
    setVisibleCount(RENDER_BATCH_SIZE);
  }, [selectedCategory]);

  // ============== UI ==============
  return (
    <View style={styles.container}>
      <SearchBar onOpenSupport={() => setSupportOpen(true)} />

      {selectedCategory === "_trending" ||
      selectedCategory === "_below99" ||
      selectedCategory === "_handcraft" ||
      selectedCategory === "_sales" ? (
        <View style={styles.categoryHeader}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.backText}> ☜ Back to All</Text>
          </TouchableOpacity>
          <Text style={styles.categoryTitle}>
            {selectedCategory === "_trending"
              ? "🔥 All Trending Products"
              : selectedCategory === "_below99"
                ? "💸 All 0~199 Products"
                : selectedCategory === "_handcraft"
                  ? "🧵 All Hand Craft Products"
                  : "💥 All Sales Products"}
          </Text>
        </View>
      ) : (
        <CategoryListBar onSelectCategory={setSelectedCategory} />
      )}

      {/* cetegory wise product show*/}
      {selectedCategory ? (
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <FlatList
            key={`cat-${selectedCategory}-${catListKey}`}
            ref={catListRef}
            data={[1]}
            keyExtractor={(_, index) => "masonry_" + index}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={2}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            extraData={visibleCount}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            renderItem={() => (
              <View style={styles.masonryContainerForCategory}>
                <View style={[styles.column, { paddingRight: 2 }]}>
                  {memoSplit.left.map((item, index) => (
                    <View
                      key={(item.cardKey || item._id) + "_L" + index}
                      style={styles.cardWrapper}
                    >
                      <UserProductCart
                        productData={item}
                        disabled={!!pressedIds[item._id]}
                        pressGuard={pressGuard}
                      />
                    </View>
                  ))}
                </View>
                <View style={[styles.column, { paddingLeft: 2 }]}>
                  {memoSplit.right.map((item, index) => (
                    <View
                      key={(item.cardKey || item._id) + "_R" + index}
                      style={styles.cardWrapper}
                    >
                      <UserProductCart
                        productData={item}
                        disabled={!!pressedIds[item._id]}
                        pressGuard={pressGuard}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderListFooter()}
          />
        </Animated.View>
      ) : (
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <FlatList
            data={[1]}
            keyExtractor={(_, index) => "masonryPage_" + index}
            initialNumToRender={4}
            maxToRenderPerBatch={6}
            windowSize={2}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            extraData={visibleCount}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            renderItem={() => (
              <View style={styles.masonryContainer}>
                {/* 🔼 Banner */}
                <BannerSlider />

                {/* 💥 Sales — only if displaySalesSlied === true (no timer) */}
                {commonInfo[0]?.isDisplaySalesSlied && (
                  <>
                    <LinearGradient
                      colors={["#E8F0FF", "#FFFFFF"]}
                      style={styles.commitHeaderWrapper}
                    >
                      <Text style={styles.commitHeaderText}>💥 Sales</Text>
                    </LinearGradient>
                    {renderSlide("salesSlide")}
                  </>
                )}

                {/* 🔥 Trending */}
                <LinearGradient
                  colors={["#F8FFB3", "#FDFFE2"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>🔥 Trending</Text>
                </LinearGradient>
                {renderSlide("tranding")}

                {/* 🧵 Hand craft */}
                {commonInfo[0]?.isDisplayHandCraftSlied && (
                  <>
                    <LinearGradient
                      colors={["#F8FFB3", "#FDFFE2"]}
                      style={styles.commitHeaderWrapper}
                    >
                      <Text style={styles.commitHeaderText}>
                        🧵 Hand craft (হস্ত শিল্প)
                      </Text>
                    </LinearGradient>
                    {renderSlide("handCraft")}
                  </>
                )}

                {/* 💸 0~199 */}
                <LinearGradient
                  colors={["#F2E6E0", "#fffce5"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>💸 0~199 Shop</Text>
                </LinearGradient>
                {renderSlide("under99")}

                {/* 🛍 For You */}
                <LinearGradient
                  colors={["#BEE4C8", "#FFF8F5"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>🛍 For You</Text>
                </LinearGradient>

                <View style={styles.masonryColumns}>
                  <View style={styles.column}>
                    {loading
                      ? [...Array(8)]
                          .filter((_, idx) => idx % 2 === 0)
                          .map((_, i) => (
                            <View key={i} style={styles.cardWrapper}>
                              <SkeletonCard />
                            </View>
                          ))
                      : memoSplit.left.map((item, index) => (
                          <View
                            key={(item.cardKey || item._id) + "_L" + index}
                            style={styles.cardWrapper}
                          >
                            <UserProductCart
                              productData={item}
                              disabled={!!pressedIds[item._id]}
                              pressGuard={pressGuard}
                            />
                          </View>
                        ))}
                  </View>

                  <View style={styles.column}>
                    {loading
                      ? [...Array(8)]
                          .filter((_, idx) => idx % 2 !== 0)
                          .map((_, i) => (
                            <View key={i} style={styles.cardWrapper}>
                              <SkeletonCard />
                            </View>
                          ))
                      : memoSplit.right.map((item, index) => (
                          <View
                            key={(item.cardKey || item._id) + "_R" + index}
                            style={styles.cardWrapper}
                          >
                            <UserProductCart
                              productData={item}
                              disabled={!!pressedIds[item._id]}
                              pressGuard={pressGuard}
                            />
                          </View>
                        ))}
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderListFooter()}
            ref={scrollRefforFlatList}
          />
        </Animated.View>
      )}
      <SupportSheet
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    backgroundColor: "#F2F2F2",
    marginBottom: 60,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  backText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "600",
    paddingBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    paddingBottom: 10,
  },
  commitHeaderWrapper: { width: "100%", paddingVertical: 8 },
  commitHeaderText: {
    fontWeight: "bold",
    fontSize: 16.7,
    color: "#222",
    left: 6,
  },
  scrollContent: { paddingHorizontal: 2, paddingTop: 30 },
  masonryContainer: { flex: 1, flexDirection: "column" },
  masonryContainerForCategory: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  cardWrapper: { marginBottom: 4 },
  column: { width: "49.5%" },
  masonryColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
});

export default HomePage;
