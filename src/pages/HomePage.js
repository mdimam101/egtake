
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useFocusEffect } from "@react-navigation/native";
// import axios from "axios";
// import { LinearGradient } from "expo-linear-gradient";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   Animated,
//   Easing,
//   FlatList,
//   InteractionManager,
//   Image as RNImage,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useDispatch, useSelector } from "react-redux";
// import ensureHttps from "../common/ensureHttps";
// import SummaryApi from "../common/SummaryApi";
// import BannerSlider from "../components/BannerSlider";
// import CategoryListBar from "../components/CategoryListBar";
// import SearchBar from "../components/SearchBar";
// import SkeletonCard from "../components/SkeletonCard";
// import SkeletonSlideCard from "../components/SkeletonSlideCard";
// import UserProductCart from "../components/UserProductCart";
// import UserSlideProductCard from "../components/UserSlideProductCard";
// import { sortProductsByUserInterest } from "../helper/sortByUserInterest";
// import { generateOptimizedVariants } from "../helper/variantUtils";
// import { setAllProductList } from "../store/allProductSlice";
// import { setTrendingList } from "../store/trendingSlice";
// import { setUnder99List } from "../store/under99Slice";

// const PAGE_SIZE = 24;

// const HomePage = () => {
//   const [loading, setLoading] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [slideAnim] = useState(new Animated.Value(0));
//   const [prevCategory, setPrevCategory] = useState(null);
//   const [sortedProducts, setSortedProducts] = useState([]);
//   const [pressedIds, setPressedIds] = useState({});

//   const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
//   const scrollRefforFlatList = useRef();

//   const [trendReady, setTrendReady] = useState(false);
//   const [underReady, setUnderReady] = useState(false);

//   // Trending 2-phase
//   const [trendingPhase, setTrendingPhase] = useState([]); // first 6
//   const [trendingAll, setTrendingAll] = useState([]);     // full list next tick

//   // Under99 2-phase
//   const [underPhase, setUnderPhase] = useState([]);       // first 6
//   const [underAll, setUnderAll] = useState([]);           // full list next tick

//   const optimizedProducts = useSelector((s) => s.productState.productList);
//   const trendingFromStore = useSelector((s) => s.trendingState.trendingList);
//   const under99FromStore = useSelector((s) => s.under99State.under99List);
//   const dispatch = useDispatch();

//   // ============== DATA FETCH ==============
//   const fetchAllProducts = async () => {
//     try {
//       // 1) Cached → instant UI
//       const cached = await AsyncStorage.getItem("productListCache");
//       if (cached) {
//         const cachedParsed = JSON.parse(cached);
//         const optimized = generateOptimizedVariants(cachedParsed);

//         dispatch(setAllProductList(optimized));

//         // Trending (latest→oldest) + de-dup by _id
//         const trendingSorted = optimized
//           .filter((p) => p.trandingProduct)
//           .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
//         const seenT = new Set();
//         const trendingUnique = [];
//         for (const it of trendingSorted) {
//           if (seenT.has(it._id)) continue;
//           seenT.add(it._id);
//           trendingUnique.push(it);
//         }
//         dispatch(setTrendingList(trendingUnique));

//         // Under99 (latest→oldest) + de-dup by _id
//         const under99Sorted = optimized
//           .filter((p) => (p.selling ?? Infinity) <= 99)
//           .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
//         const seenU = new Set();
//         const under99Unique = [];
//         for (const it of under99Sorted) {
//           if (seenU.has(it._id)) continue;
//           seenU.add(it._id);
//           under99Unique.push(it);
//         }
//         dispatch(setUnder99List(under99Unique));

//         setLoading(false);
//       }

//       // 2) Fresh API
//       const res = await axios.get(SummaryApi.get_product.url);
//       if (res.data?.success) {
//         const newData = res.data.data || [];

//         const needUpdate = (() => {
//           if (!cached) return true;
//           try {
//             const prev = JSON.parse(cached);
//             if ((prev?.length || 0) !== newData.length) return true;
//             const a = prev[prev.length - 1]?._id;
//             const b = newData[newData.length - 1]?._id;
//             return a !== b;
//           } catch {
//             return true;
//           }
//         })();

//         if (needUpdate) {
//           await AsyncStorage.setItem("productListCache", JSON.stringify(newData));
//           const optimized = generateOptimizedVariants(newData);
//           dispatch(setAllProductList(optimized));

//           const trendingSorted = optimized
//             .filter((p) => p.trandingProduct)
//             .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
//           const seenT2 = new Set();
//           const trendingUnique2 = [];
//           for (const it of trendingSorted) {
//             if (seenT2.has(it._id)) continue;
//             seenT2.add(it._id);
//             trendingUnique2.push(it);
//           }
//           dispatch(setTrendingList(trendingUnique2));

//           const under99Sorted = optimized
//             .filter((p) => (p.selling ?? Infinity) <= 99)
//             .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
//           const seenU2 = new Set();
//           const under99Unique2 = [];
//           for (const it of under99Sorted) {
//             if (seenU2.has(it._id)) continue;
//             seenU2.add(it._id);
//             under99Unique2.push(it);
//           }
//           dispatch(setUnder99List(under99Unique2));
//         }
//       }
//     } catch (err) {
//       console.log("❌ Product fetch failed", err);
//     }

//     setLoading(false);
//   };

//   useEffect(() => {
//     if (optimizedProducts.length === 0) {
//       fetchAllProducts();
//     } else {
//       setLoading(false);
//     }
     
//   // }, [optimizedProducts.length]);
//   }, []);

//   // ============== IMAGE PREFETCH HELPERS ==============
//   const serialPrefetch = async (urls = []) => {
//     for (const u of urls) {
//       if (!u) continue;
//       try {
//         await RNImage.prefetch(ensureHttps(u));
//       } catch {}
//     }
//   };

//   const priorityPreloadSlide = async (products = [], take = 6) => {
//     const imgs = products
//       .slice(0, take)
//       .map((p) => ensureHttps(p?.img))
//       .filter(Boolean);

//     // priority serial
//     await serialPrefetch(imgs);

//     // rest background
//     InteractionManager.runAfterInteractions(() => {
//       const rest = products
//         .slice(take, 30)
//         .map((p) => ensureHttps(p?.img))
//         .filter(Boolean);
//       rest.forEach((u) => RNImage.prefetch(u));
//     });
//   };

//   // ============== SORT BY USER INTEREST (BACKGROUND) ==============
//   useEffect(() => {
//     if (optimizedProducts.length > 0) {
//       const task = InteractionManager.runAfterInteractions(() => {
//         sortProductsByUserInterest(optimizedProducts).then(setSortedProducts);
//       });
//       return () => task.cancel?.();
//     }
//   }, [optimizedProducts]);

//   // Trending 2-phase
//   useEffect(() => {
//     if (!trendingFromStore || trendingFromStore.length === 0) {
//       setTrendingPhase([]);
//       setTrendingAll([]);
//       return;
//     }
//     const first6 = trendingFromStore.slice(0, 6);
//     setTrendingPhase(first6);
//     setTrendingAll([]);
//     const id = setTimeout(() => setTrendingAll(trendingFromStore), 0);
//     return () => clearTimeout(id);
//   }, [trendingFromStore]);

//   // Under99 2-phase
//   useEffect(() => {
//     if (!under99FromStore || under99FromStore.length === 0) {
//       setUnderPhase([]);
//       setUnderAll([]);
//       return;
//     }
//     const first6 = under99FromStore.slice(0, 6);
//     setUnderPhase(first6);
//     setUnderAll([]);
//     const id = setTimeout(() => setUnderAll(under99FromStore), 0);
//     return () => clearTimeout(id);
//   }, [under99FromStore]);

//   // priority preload for top items (Trending + 0~99)
//   useEffect(() => {
//     if (trendingPhase.length === 0 && underPhase.length === 0) return;

//     setTrendReady(false);
//     setUnderReady(false);

//     const jobs = [];
//     if (trendingPhase.length)
//       jobs.push(priorityPreloadSlide(trendingPhase, 6).then(() => setTrendReady(true)));
//     if (underPhase.length)
//       jobs.push(priorityPreloadSlide(underPhase, 6).then(() => setUnderReady(true)));

//     let cancelled = false;
//     Promise.allSettled(jobs).then(() => {
//       if (cancelled) return;
//     });
//     return () => {
//       cancelled = true;
//     };
//   }, [trendingPhase, underPhase]);

//   // ============== CLICK GUARD & FOCUS ==============
//   useFocusEffect(
//     useCallback(() => {
//       setPressedIds({});
//       return () => {};
//     }, [])
//   );

//   const pressGuard = useCallback(
//     (id) => {
//       if (!id) return true;
//       if (pressedIds[id]) return false;
//       setPressedIds((prev) => ({ ...prev, [id]: true }));
//       return true;
//     },
//     [pressedIds]
//   );

//   // ============== DERIVED LISTS ==============
//   const trendingProducts = trendingAll.length ? trendingAll : trendingPhase;
//   const under99Products = underAll.length ? underAll : underPhase;

//   const filteredProducts = selectedCategory
//     ? selectedCategory === "_trending"
//       ? trendingFromStore
//       : selectedCategory === "_below99"
//       ? under99FromStore
//       : sortedProducts.filter(
//           (item) =>
//             item.category?.toLowerCase() === selectedCategory?.toLowerCase()
//         )
//     : sortedProducts;

//   const totalLength = selectedCategory
//     ? filteredProducts.length
//     : sortedProducts.length;

//   const memoFiltered = useMemo(() => {
//     return selectedCategory
//       ? filteredProducts.slice(0, visibleCount)
//       : sortedProducts.slice(0, visibleCount);
//   }, [selectedCategory, filteredProducts, sortedProducts, visibleCount]);

//   const canLoadMore = visibleCount < totalLength;
//  const handleEndReached = useCallback(() => {
//    if (!canLoadMore) return;
//    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalLength));
//  }, [canLoadMore, totalLength]);

//   // ============== RENDERERS ==============
//   const commonKeyExtractor = (item, index) =>
//     item?.cardKey
//       ? item.cardKey
//       : item?._id
//       ? `${item._id}::${item?.img || ""}::${item?.variantColor || ""}::${item?.variantSize || ""}::${index}`
//       : `last_${index}`;

//   const renderTrending = () => {
//     if (loading) {
//       return (
//         <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 4 }}>
//           {[...Array(6)].map((_, i) => (
//             <SkeletonSlideCard key={i} />
//           ))}
//         </View>
//       );
//     }
//     const limitedList = trendingProducts.slice(0, 4);
//     const displayList = [...limitedList, { isLast: true }];
//     return (
//       <FlatList
//         style={{ paddingLeft: 5 }}
//         data={displayList}
//         initialNumToRender={3}
//         maxToRenderPerBatch={3}
//         windowSize={2}
//         updateCellsBatchingPeriod={50}
//         removeClippedSubviews
//         renderItem={({ item }) => (
//           <UserSlideProductCard
//             productData={item}
//             isLast={item.isLast}
//             onViewMorePress={() => setSelectedCategory("_trending")}
//             disabled={item.isLast ? false : !!pressedIds[item._id]}
//             pressGuard={item.isLast ? undefined : pressGuard}
//           />
//         )}
//         keyExtractor={commonKeyExtractor}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//       />
//     );
//   };

//   const renderShopUnder99 = () => {
//     if (loading) {
//       return (
//         <View style={{ flexDirection: "row", paddingHorizontal: 10, gap: 4 }}>
//           {[...Array(6)].map((_, i) => (
//             <SkeletonSlideCard key={i} />
//           ))}
//         </View>
//       );
//     }
//     const limitedList = under99Products.slice(0, 4);
//     const displayList = [...limitedList, { isLast: true }];

//     return (
//       <FlatList
//         style={{ paddingLeft: 5 }}
//         data={displayList}
//         initialNumToRender={4}
//         maxToRenderPerBatch={4}
//         windowSize={2}
//         updateCellsBatchingPeriod={50}
//         removeClippedSubviews
//         renderItem={({ item }) => (
//           <UserSlideProductCard
//             productData={item}
//             isLast={item.isLast}
//             onViewMorePress={() => setSelectedCategory("_below99")}
//             disabled={item.isLast ? false : !!pressedIds[item._id]}
//             pressGuard={item.isLast ? undefined : pressGuard}
//           />
//         )}
//         keyExtractor={commonKeyExtractor}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//       />
//     );
//   };

//   // ============== ANIMATION & SCROLL ==============
//   useEffect(() => {
//     let isGoingBackToAll = !selectedCategory && prevCategory;
//     let isGoingToCategory = selectedCategory && !prevCategory;

//     if (prevCategory === null && selectedCategory === null) return;

//     if (isGoingBackToAll) slideAnim.setValue(-300);
//     else if (isGoingToCategory || selectedCategory) slideAnim.setValue(300);

//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 300,
//       easing: Easing.out(Easing.ease),
//       useNativeDriver: true,
//     }).start();

//     setPrevCategory(selectedCategory);
//   }, [selectedCategory]);

//   const scrollToTop = () => {
//     if (scrollRefforFlatList.current) {
//       scrollRefforFlatList.current.scrollToOffset({ offset: 0, animated: true });
//     }
//   };

//   useEffect(() => {
//     scrollToTop();
//     setVisibleCount(PAGE_SIZE);
//   }, [selectedCategory]);

//   // ============== UI ==============
//   return (
//     <View style={styles.container}>
//       <SearchBar />

//       {selectedCategory === "_trending" || selectedCategory === "_below99" ? (
//         <View style={styles.categoryHeader}>
//           <TouchableOpacity onPress={() => setSelectedCategory(null)}>
//             <Text style={styles.backText}>← Back to All</Text>
//           </TouchableOpacity>
//           <Text style={styles.categoryTitle}>
//             {selectedCategory === "_trending"
//               ? "🔥 All Trending Products"
//               : "💸 All 0~99 Products"}
//           </Text>
//         </View>
//       ) : (
//         <CategoryListBar onSelectCategory={setSelectedCategory} />
//       )}

//       {selectedCategory ? (
//         <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
//           <FlatList
//             data={[1]}
//             keyExtractor={(_, index) => "masonry_" + index}
//             initialNumToRender={10}
//             maxToRenderPerBatch={15}
//             windowSize={2}
//             updateCellsBatchingPeriod={50}
//             removeClippedSubviews={false}
//  extraData={visibleCount}           // 👈 FlatList-কে রিরেন্ডার হিন্ট
//  onEndReached={handleEndReached}
//  onEndReachedThreshold={0.4}
//             renderItem={() => (
//               <View style={styles.masonryContainerForCategory}>
//                 <View style={styles.column}>
//                   {memoFiltered
//                     .filter((_, idx) => idx % 2 === 0)
//                     .map((item, index) => (
//                       <View
//                         key={(item.cardKey || item._id) + "_L" + index}
//                         style={styles.cardWrapper}
//                       >
//                         <UserProductCart
//                           productData={item}
//                           disabled={!!pressedIds[item._id]}
//                           pressGuard={pressGuard}
//                         />
//                       </View>
//                     ))}
//                 </View>

//                 <View style={styles.column}>
//                   {memoFiltered
//                     .filter((_, idx) => idx % 2 !== 0)
//                     .map((item, index) => (
//                       <View
//                         key={(item.cardKey || item._id) + "_R" + index}
//                         style={styles.cardWrapper}
//                       >
//                         <UserProductCart
//                           productData={item}
//                           disabled={!!pressedIds[item._id]}
//                           pressGuard={pressGuard}
//                         />
//                       </View>
//                     ))}
//                 </View>
//               </View>
//             )}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             ListFooterComponent={
//        canLoadMore ? (
//      <View style={{ paddingVertical: 15 }}>
//        <Text style={{ textAlign: "center" }}>Loading more...</Text>
//      </View>
//    ) : <View style={{ height: 8 }} />
//  }
//           />
//         </Animated.View>
//       ) : (
//         <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
//           <FlatList
//             data={[1]}
//             keyExtractor={(_, index) => "masonryPage_" + index}
//             initialNumToRender={4}
//             maxToRenderPerBatch={6}
//             windowSize={2}
//             updateCellsBatchingPeriod={50}
//             removeClippedSubviews={false}
//  extraData={visibleCount}
//  onEndReached={handleEndReached}
//  onEndReachedThreshold={0.4}
//             renderItem={() => (
//               <View style={styles.masonryContainer}>
//                 {/* 🔼 Banner */}
//                 <BannerSlider />

//                 {/* 🔥 Trending */}
//                 <LinearGradient colors={["#F8FFB3", "#FDFFE2"]} style={styles.commitHeaderWrapper}>
//                   <Text style={styles.commitHeaderText}>🔥 Trending</Text>
//                 </LinearGradient>
//                 {renderTrending()}

//                 {/* 💸 0~99 */}
//                 <LinearGradient colors={["#F2E6E0", "#fffce5"]} style={styles.commitHeaderWrapper}>
//                   <Text style={styles.commitHeaderText}>💸 0~99 Shop</Text>
//                 </LinearGradient>
//                 {renderShopUnder99()}

//                 {/* 🛍 All Products */}
//                 <LinearGradient colors={["#BEE4C8", "#FFF8F5"]} style={styles.commitHeaderWrapper}>
//                   <Text style={styles.commitHeaderText}>🛍 All Products</Text>
//                 </LinearGradient>

//                 <View style={styles.masonryColumns}>
//                   <View style={styles.column}>
//                     {loading
//                       ? [...Array(8)]
//                           .filter((_, idx) => idx % 2 === 0)
//                           .map((_, i) => (
//                             <View key={i} style={styles.cardWrapper}>
//                               <SkeletonCard />
//                             </View>
//                           ))
//                       : memoFiltered
//                           .filter((_, idx) => idx % 2 === 0)
//                           .map((item, index) => (
//                             <View
//                               key={(item.cardKey || item._id) + "_L" + index}
//                               style={styles.cardWrapper}
//                             >
//                               <UserProductCart
//                                 productData={item}
//                                 disabled={!!pressedIds[item._id]}
//                                 pressGuard={pressGuard}
//                               />
//                             </View>
//                           ))}
//                   </View>

//                   <View style={styles.column}>
//                     {loading
//                       ? [...Array(8)]
//                           .filter((_, idx) => idx % 2 !== 0)
//                           .map((_, i) => (
//                             <View key={i} style={styles.cardWrapper}>
//                               <SkeletonCard />
//                             </View>
//                           ))
//                       : memoFiltered
//                           .filter((_, idx) => idx % 2 !== 0)
//                           .map((item, index) => (
//                             <View
//                               key={(item.cardKey || item._id) + "_R" + index}
//                               style={styles.cardWrapper}
//                             >
//                               <UserProductCart
//                                 productData={item}
//                                 disabled={!!pressedIds[item._id]}
//                                 pressGuard={pressGuard}
//                               />
//                             </View>
//                           ))}
//                   </View>
//                 </View>
//               </View>
//             )}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//            ListFooterComponent={
//    canLoadMore ? (
//      <View style={{ paddingVertical: 15 }}>
//        <Text style={{ textAlign: "center" }}>Loading more...</Text>
//      </View>
//    ) : <View style={{ height: 8 }} />
//  }
//             ref={scrollRefforFlatList}
//           />
//         </Animated.View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 80,
//     backgroundColor: "#F2F2F2",
//     marginBottom: 60,
//   },
//   categoryHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     backgroundColor: "#f9f9f9",
//     borderBottomWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   backText: { fontSize: 16, color: "#007BFF", fontWeight: "600" },
//   categoryTitle: { fontSize: 16, fontWeight: "500", color: "#333" },
//   commitHeaderWrapper: { width: "100%", paddingVertical: 8 },
//   commitHeaderText: { fontWeight: "bold", fontSize: 16.7, color: "#222", left: 6 },
//   scrollContent: { paddingHorizontal: 2, paddingTop: 35 },
//   masonryContainer: { flex: 1, flexDirection: "column" },
//   masonryContainerForCategory: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     flexWrap: "wrap",
//     paddingLeft: 4,
//     paddingRight: 4,
//   },
//   cardWrapper: { marginBottom: 4 },
//   column: { width: "49.5%" },
//   masonryColumns: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 5,
//   },
// });

// export default HomePage;


import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { setTrendingList } from "../store/trendingSlice";
import { setUnder99List } from "../store/under99Slice";

const PAGE_SIZE = 24;

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [prevCategory, setPrevCategory] = useState(null);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [pressedIds, setPressedIds] = useState({});

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRefforFlatList = useRef();

  // Trending 2-phase
  const [trendingPhase, setTrendingPhase] = useState([]); // first 6
  const [trendingAll, setTrendingAll] = useState([]);     // full list next tick

  // Under99 2-phase
  const [underPhase, setUnderPhase] = useState([]);       // first 6
  const [underAll, setUnderAll] = useState([]);           // full list next tick

  const optimizedProducts = useSelector((s) => s.productState.productList);
  const trendingFromStore = useSelector((s) => s.trendingState.trendingList);
  const under99FromStore = useSelector((s) => s.under99State.under99List);
  const dispatch = useDispatch();

  // ============== DATA FETCH ==============
  const fetchAllProducts = async () => {
    try {
      // 1) Cached → instant UI
      const cached = await AsyncStorage.getItem("productListCache");
      if (cached) {
        const cachedParsed = JSON.parse(cached);
        const optimized = generateOptimizedVariants(cachedParsed);
        dispatch(setAllProductList(optimized));

        // Trending (latest→oldest) + de-dup by _id
        const trendingSorted = optimized
          .filter((p) => p.trandingProduct)
          .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
        const seenT = new Set();
        const trendingUnique = [];
        for (const it of trendingSorted) {
          if (seenT.has(it._id)) continue;
          seenT.add(it._id);
          trendingUnique.push(it);
        }
        dispatch(setTrendingList(trendingUnique));

        // Under99 (latest→oldest) + de-dup by _id
        const under99Sorted = optimized
          .filter((p) => (p.selling ?? Infinity) <= 99)
          .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
        const seenU = new Set();
        const under99Unique = [];
        for (const it of under99Sorted) {
          if (seenU.has(it._id)) continue;
          seenU.add(it._id);
          under99Unique.push(it);
        }
        dispatch(setUnder99List(under99Unique));

        setLoading(false);
      }

      // 2) Fresh API
      const res = await axios.get(SummaryApi.get_product.url);
      if (res.data?.success) {
        const newData = res.data.data || [];

        const needUpdate = (() => {
          if (!cached) return true;
          try {
            const prev = JSON.parse(cached);
            if ((prev?.length || 0) !== newData.length) return true;
            const a = prev[prev.length - 1]?._id;
            const b = newData[newData.length - 1]?._id;
            return a !== b;
          } catch {
            return true;
          }
        })();

        if (needUpdate) {
          await AsyncStorage.setItem("productListCache", JSON.stringify(newData));
          const optimized = generateOptimizedVariants(newData);
          dispatch(setAllProductList(optimized));

          const trendingSorted = optimized
            .filter((p) => p.trandingProduct)
            .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
          const seenT2 = new Set();
          const trendingUnique2 = [];
          for (const it of trendingSorted) {
            if (seenT2.has(it._id)) continue;
            seenT2.add(it._id);
            trendingUnique2.push(it);
          }
          dispatch(setTrendingList(trendingUnique2));

          const under99Sorted = optimized
            .filter((p) => (p.selling ?? Infinity) <= 99)
            .sort((a, b) => (b.createdTs || 0) - (a.createdTs || 0));
          const seenU2 = new Set();
          const under99Unique2 = [];
          for (const it of under99Sorted) {
            if (seenU2.has(it._id)) continue;
            seenU2.add(it._id);
            under99Unique2.push(it);
          }
          dispatch(setUnder99List(under99Unique2));
        }
      }
    } catch (err) {
      // console.log("❌ Product fetch failed", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (optimizedProducts.length === 0) {
      fetchAllProducts();
    } else {
      setLoading(false);
    }
  }, []);

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
    if (optimizedProducts.length > 0) {
      const task = InteractionManager.runAfterInteractions(() =>
        sortProductsByUserInterest(optimizedProducts).then(setSortedProducts)
      );
      return () => task.cancel?.();
    }
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

  // Prefetch images for top-of-sections (no extra state toggles)
  useEffect(() => {
    if (trendingPhase.length === 0 && underPhase.length === 0) return;
    const jobs = [];
    if (trendingPhase.length) jobs.push(priorityPreloadSlide(trendingPhase, 6));
    if (underPhase.length) jobs.push(priorityPreloadSlide(underPhase, 6));
    Promise.allSettled(jobs);
  }, [trendingPhase, underPhase]);

  // ============== CLICK GUARD & FOCUS ==============
  useFocusEffect(
    useCallback(() => {
      setPressedIds({});
      return () => {};
    }, [])
  );

  const pressGuard = useCallback(
    (id) => {
      if (!id) return true;
      if (pressedIds[id]) return false;
      setPressedIds((prev) => ({ ...prev, [id]: true }));
      return true;
    },
    [pressedIds]
  );

  // ============== DERIVED LISTS ==============
  const trendingProducts = trendingAll.length ? trendingAll : trendingPhase;
  const under99Products = underAll.length ? underAll : underPhase;

  const filteredProducts = selectedCategory
    ? selectedCategory === "_trending"
      ? trendingFromStore
      : selectedCategory === "_below99"
      ? under99FromStore
      : sortedProducts.filter(
          (item) =>
            item.category?.toLowerCase() === selectedCategory?.toLowerCase()
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

  // pagination guard + handler
  const endLock = useRef(false);
  const canLoadMore = visibleCount < totalLength;
  const handleEndReached = useCallback(() => {
    if (endLock.current || !canLoadMore) return;
    endLock.current = true;
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalLength));
      endLock.current = false;
    });
  }, [canLoadMore, totalLength]);

  // ============== RENDERERS ==============
  const commonKeyExtractor = (item, index) =>
    item?.cardKey
      ? item.cardKey
      : item?._id
      ? `${item._id}::${item?.img || ""}::${item?.variantColor || ""}::${item?.variantSize || ""}::${index}`
      : `last_${index}`;

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
    const limitedList = trendingProducts.slice(0, 4);
    const displayList = [...limitedList, { isLast: true }];
    return (
      <FlatList
        style={{ paddingLeft: 5 }}
        data={displayList}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={2}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        renderItem={({ item }) => (
          <UserSlideProductCard
            productData={item}
            isLast={item.isLast}
            onViewMorePress={() => setSelectedCategory("_trending")}
            disabled={item.isLast ? false : !!pressedIds[item._id]}
            pressGuard={item.isLast ? undefined : pressGuard}
          />
        )}
        keyExtractor={commonKeyExtractor}
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
    const limitedList = under99Products.slice(0, 4);
    const displayList = [...limitedList, { isLast: true }];

    return (
      <FlatList
        style={{ paddingLeft: 5 }}
        data={displayList}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={2}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        renderItem={({ item }) => (
          <UserSlideProductCard
            productData={item}
            isLast={item.isLast}
            onViewMorePress={() => setSelectedCategory("_below99")}
            disabled={item.isLast ? false : !!pressedIds[item._id]}
            pressGuard={item.isLast ? undefined : pressGuard}
          />
        )}
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

    if (isGoingBackToAll) slideAnim.setValue(-300);
    else if (isGoingToCategory || selectedCategory) slideAnim.setValue(300);

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
      scrollRefforFlatList.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  useEffect(() => {
    scrollToTop();
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory]);

  // ============== UI ==============
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
            data={[1]}
            keyExtractor={(_, index) => "masonry_" + index}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={2}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={false}
            extraData={visibleCount}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            renderItem={() => (
              <View style={styles.masonryContainerForCategory}>
                <View style={styles.column}>
                  {memoFiltered
                    .filter((_, idx) => idx % 2 === 0)
                    .map((item, index) => (
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
                  {memoFiltered
                    .filter((_, idx) => idx % 2 !== 0)
                    .map((item, index) => (
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
            ListFooterComponent={
              canLoadMore ? (
                <View style={{ paddingVertical: 15 }}>
                  <Text style={{ textAlign: "center" }}>Loading more...</Text>
                </View>
              ) : (
                <View style={{ height: 8 }} />
              )
            }
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
            removeClippedSubviews={false}
            extraData={visibleCount}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            renderItem={() => (
              <View style={styles.masonryContainer}>
                {/* 🔼 Banner */}
                <BannerSlider />

                {/* 🔥 Trending */}
                <LinearGradient colors={["#F8FFB3", "#FDFFE2"]} style={styles.commitHeaderWrapper}>
                  <Text style={styles.commitHeaderText}>🔥 Trending</Text>
                </LinearGradient>
                {renderTrending()}

                {/* 💸 0~99 */}
                <LinearGradient colors={["#F2E6E0", "#fffce5"]} style={styles.commitHeaderWrapper}>
                  <Text style={styles.commitHeaderText}>💸 0~99 Shop</Text>
                </LinearGradient>
                {renderShopUnder99()}

                {/* 🛍 All Products */}
                <LinearGradient colors={["#BEE4C8", "#FFF8F5"]} style={styles.commitHeaderWrapper}>
                  <Text style={styles.commitHeaderText}>🛍 All Products</Text>
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
                      : memoFiltered
                          .filter((_, idx) => idx % 2 === 0)
                          .map((item, index) => (
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
                      : memoFiltered
                          .filter((_, idx) => idx % 2 !== 0)
                          .map((item, index) => (
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
            ListFooterComponent={
              canLoadMore ? (
                <View style={{ paddingVertical: 15 }}>
                  <Text style={{ textAlign: "center" }}>Loading more...</Text>
                </View>
              ) : (
                <View style={{ height: 8 }} />
              )
            }
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
  backText: { fontSize: 16, color: "#007BFF", fontWeight: "600" },
  categoryTitle: { fontSize: 16, fontWeight: "500", color: "#333" },
  commitHeaderWrapper: { width: "100%", paddingVertical: 8 },
  commitHeaderText: { fontWeight: "bold", fontSize: 16.7, color: "#222", left: 6 },
  scrollContent: { paddingHorizontal: 2, paddingTop: 35 },
  masonryContainer: { flex: 1, flexDirection: "column" },
  masonryContainerForCategory: {
    flexDirection: "row",
    justifyContent: "space_between",
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
