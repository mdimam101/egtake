import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import BannerSlider from "../components/BannerSlider";
import CategoryListBar from "../components/CategoryListBar";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard";
import SkeletonSlideCard from "../components/SkeletonSlideCard";
import UserProductCart from "../components/UserProductCart";
import UserSlideProductCard from "../components/UserSlideProductCard";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";
import { generateOptimizedVariants } from "../helper/variantUtils";
import { setAllProductList } from "../store/allProductSlice";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  // const [columnLeft, setColumnLeft] = useState([]);
  // const [columnRight, setColumnRight] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [prevCategory, setPrevCategory] = useState(null);
  const [sortedProducts, setSortedProducts] = useState([]);

  const [visibleCount, setVisibleCount] = useState(100); // how many products to show initially
  const scrollRefforFlatList = useRef();

  const getAllProductFromStore = useSelector(
    (state) => state.productState.productList
  );
  const optimizedProducts = getAllProductFromStore;
  const dispatch = useDispatch();

  useEffect(() => {
    if (optimizedProducts.length === 0) {
      fetchAllProducts();
    } else {
      setLoading(false); // loading শেষ
    }
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true); // loading শুরু
    try {
      const res = await axios.get(SummaryApi.get_product.url);
      if (res.data.success) {
        const products = res.data.data || [];

        // ✅ lightweight optimized list তৈরি করে redux এ store করো
        const optimized = generateOptimizedVariants(products);
        // redux only holds optimized version
        dispatch(setAllProductList(optimized));
      }
    } catch (err) {}
    setLoading(false); // loading শেষ
  };

  useEffect(() => {
    if (optimizedProducts.length > 0) {
      const task = InteractionManager.runAfterInteractions(() => {
        sortProductsByUserInterest(optimizedProducts).then(setSortedProducts);
      });
      return () => task.cancel(); // 🧹 Clean up if component unmounts
    }
  }, [optimizedProducts]);

  const trendingProducts = sortedProducts.filter((p) => p.trandingProduct);
  const productsBelow99 = sortedProducts.filter((p) => p.selling <= 99);

  const filteredProducts = selectedCategory
    ? selectedCategory === "_trending"
      ? trendingProducts
      : selectedCategory === "_below99"
      ? productsBelow99
      : sortedProducts.filter(
          (item) =>
            item.category?.toLowerCase() === selectedCategory.toLowerCase()
        )
    : sortedProducts;

      const totalLength = selectedCategory
    ? filteredProducts.length
    : sortedProducts.length;

  const memoFiltered = useMemo(() => {
    return selectedCategory
      ? filteredProducts.slice(0, visibleCount)
      : sortedProducts.slice(0, visibleCount);
  }, [selectedCategory, filteredProducts, sortedProducts, visibleCount]);

  const renderTrending = () => {
    if (loading) {
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 4 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonSlideCard key={i} />
          ))}
        </View>
      );
    }
    const limitedList = trendingProducts.slice(0, 6);
    const displayList = [...limitedList, { isLast: true }];
    return (
      <FlatList
        style={{ paddingLeft: 5 }}
        data={displayList}
        initialNumToRender={10} // 🔸 render only 10 at first
        maxToRenderPerBatch={15} // 🔸 render 15 at a time when scrolling
        removeClippedSubviews={true} // 🔸 offscreen item remove from memory
        renderItem={({ item }) => (
          <UserSlideProductCard
            productData={item}
            isLast={item.isLast}
            onViewMorePress={() => setSelectedCategory("_trending")}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    );
  };

  const renderShopUnder99 = () => {
    if (loading) {
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 4 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonSlideCard key={i} />
          ))}
        </View>
      );
    }
    const limitedList = productsBelow99.slice(0, 6);
    const displayList = [...limitedList, { isLast: true }];

    return (
      <FlatList
        style={{ paddingLeft: 5 }}
        data={displayList}
        initialNumToRender={10} // 🔸 render only 10 at first
        maxToRenderPerBatch={15} // 🔸 render 15 at a time when scrolling
        removeClippedSubviews={true} // 🔸 offscreen item remove from memory
        renderItem={({ item }) => (
          <UserSlideProductCard
            productData={item}
            isLast={item.isLast}
            onViewMorePress={() => setSelectedCategory("_below99")}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    );
  };

  useEffect(() => {
    let isGoingBackToAll = !selectedCategory && prevCategory;
    let isGoingToCategory = selectedCategory && !prevCategory;

    // প্রথমবার app load এ animation না চালাতে
    if (prevCategory === null && selectedCategory === null) return;

    if (isGoingBackToAll) {
      slideAnim.setValue(-300); // 👉 from left
    } else if (isGoingToCategory || selectedCategory) {
      slideAnim.setValue(300); // 👉 from right
    }

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setPrevCategory(selectedCategory);
  }, [selectedCategory]);

  const scrollToTop = () => {
    if (scrollRefforFlatList.current) {
      scrollRefforFlatList.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  };

  useEffect(() => {
    scrollToTop();
    // reset visibleCount when category changes
    setVisibleCount(100); // 👈 add this line to start from top of new list
  }, [selectedCategory]);

  // 🧹 Clean memory when screen is blurred (navigated away)
  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       // Memory clean
  //       setSortedProducts([]);
  //       setVisibleCount(100);
  //     };
  //   }, [])
  // );

  return (
    <View style={styles.container}>
      <SearchBar />

      {selectedCategory === "_trending" || selectedCategory === "_below99" ? (
        <View style={styles.categoryHeader}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.backText}>← Back to All</Text>
          </TouchableOpacity>
          <Text style={styles.categoryTitle}>
            {selectedCategory === "_trending"
              ? "🔥 All Trending Products"
              : "💸 All 0~99 Products"}
          </Text>
        </View>
      ) : (
        <CategoryListBar onSelectCategory={setSelectedCategory} />
      )}

      {selectedCategory ? (
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <FlatList
            data={[1]} // ✅ dummy 1 item so FlatList renders 1 item
            keyExtractor={(item, index) => "masonry_" + index}
            initialNumToRender={10} // 🔸 render only 10 at first
            maxToRenderPerBatch={15} // 🔸 render 15 at a time when scrolling
            removeClippedSubviews={true} // 🔸 offscreen item remove from memory
            renderItem={() => (
              <View style={styles.masonryContainerForCategory}>
                {/* Left Column (Even) */}
                <View style={styles.column}>
                  {memoFiltered
                    .filter((_, idx) => idx % 2 === 0)
                    .map((item, index) => (
                      <View
                        key={item._id + "_L" + index}
                        style={styles.cardWrapper}
                      >
                        <UserProductCart productData={item} />
                      </View>
                    ))}
                </View>

                {/* Right Column (Odd) */}
                <View style={styles.column}>
                  {memoFiltered
                    .filter((_, idx) => idx % 2 !== 0)
                    .map((item, index) => (
                      <View
                        key={item._id + "_R" + index}
                        style={styles.cardWrapper}
                      >
                        <UserProductCart productData={item} />
                      </View>
                    ))}
                </View>
              </View>
            )}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const paddingToBottom = 50;
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;

              const isNearBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;

              //if (isNearBottom && visibleCount < memoFiltered.length) {
              if (isNearBottom && visibleCount < totalLength) {
                setVisibleCount((prev) =>
                  // Math.min(prev + 50, memoFiltered.length)
                Math.min(prev + 50, totalLength)
                );
              }
            }}
            scrollEventThrottle={400}
            onEndReachedThreshold={0.3}
          />
        </Animated.View>
      ) : (
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <FlatList
            data={[1]} // dummy one item to render full page
            keyExtractor={(item, index) => "masonryPage_" + index}
            initialNumToRender={10} // 🔸 render only 10 at first
            maxToRenderPerBatch={15} // 🔸 render 15 at a time when scrolling
            removeClippedSubviews={true} // 🔸 offscreen item remove from memory
            renderItem={() => (
              <View style={styles.masonryContainer}>
                {/* 🔼 Banner */}
                <BannerSlider />

                {/* 🔥 Trending section */}
                <LinearGradient
                  colors={["#F8FFB3", "#FDFFE2"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>🔥 Trending</Text>
                </LinearGradient>
                {renderTrending()}

                {/* 💸 0~99 section */}
                <LinearGradient
                  colors={["#F2E6E0", "#fffce5"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>💸 0~99 Shop</Text>
                </LinearGradient>
                {renderShopUnder99()}

                {/* 🛍 All Products section */}
                <LinearGradient
                  colors={["#BEE4C8", "#FFF8F5"]}
                  style={styles.commitHeaderWrapper}
                >
                  <Text style={styles.commitHeaderText}>🛍 All Products</Text>
                </LinearGradient>

                <View style={styles.masonryColumns}>
                  {/* Left Column */}
                  <View style={styles.column}>
                    {loading
                      ? [...Array(8)]
                          .filter((_, idx) => idx % 2 === 0)
                          .map((_, i) => (
                            <View key={i} style={styles.cardWrapper}>
                              <SkeletonCard />
                            </View>
                          ))
                      : memoFiltered
                          .filter((_, idx) => idx % 2 === 0)
                          .map((item, index) => (
                            <View
                              key={item._id + "_L" + index}
                              style={styles.cardWrapper}
                            >
                              <UserProductCart productData={item} />
                            </View>
                          ))}
                  </View>

                  {/* Right Column */}
                  <View style={styles.column}>
                    {loading
                      ? [...Array(8)]
                          .filter((_, idx) => idx % 2 !== 0)
                          .map((_, i) => (
                            <View key={i} style={styles.cardWrapper}>
                              <SkeletonCard />
                            </View>
                          ))
                      : memoFiltered
                          .filter((_, idx) => idx % 2 !== 0)
                          .map((item, index) => (
                            <View
                              key={item._id + "_R" + index}
                              style={styles.cardWrapper}
                            >
                              <UserProductCart productData={item} />
                            </View>
                          ))}
                  </View>
                </View>

                {/* 👇 Loading more message */}
                {visibleCount < sortedProducts.length && (
                  <View style={{ paddingVertical: 15 }}>
                    <Text style={{ textAlign: "center" }}>Loading more...</Text>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const paddingToBottom = 50;
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;

              const isNearBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;

              //if (isNearBottom && visibleCount < memoFiltered.length) {
              if (isNearBottom && visibleCount < totalLength) {
                setVisibleCount((prev) =>
                  // Math.min(prev + 50, memoFiltered.length)
                Math.min(prev + 50, totalLength)
                );
              }
            }}
            onEndReachedThreshold={0.3}
            scrollEventThrottle={400}
            ref={scrollRefforFlatList}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 95,
    paddingTop: 80,
    backgroundColor: "#F2F2F2", // ✅ previously was backfaceVisibility
    marginBottom: 90, // ✅ keeps last items clear of the footer
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  backText: { fontSize: 16, color: "#007BFF", fontWeight: "600" },
  categoryTitle: { fontSize: 16, fontWeight: "500", color: "#333" },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 12,
    paddingHorizontal: 11,
  },
  commitHeaderWrapper: {
    width: "100%",
    paddingVertical: 8,
    // marginBottom: 2,
  },
  commitHeaderText: {
    fontWeight: "bold",
    fontSize: 16.7,
    color: "#222",
    left: 6,
  },
  scrollContent: { paddingHorizontal: 2, paddingTop: 35 },
  masonryContainer: { flex: 1, flexDirection: "column" },
  masonryContainerForCategory: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingLeft: 4,
    paddingRight: 4,
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
