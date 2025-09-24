
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import CategoryListBar from "../components/CategoryListBar"; // same as homepage top bar
import SearchBar from "../components/SearchBar";
import UserProductCart from "../components/UserProductCart";
import { generateOptimizedVariants } from "../helper/variantUtils";

const SubCategoryWiseProduct = ({ route }) => {
  const { subCategory } = route.params; // ✅ React Native equivalent of useParams()
  const [wishSubProductList, setWishSubProductList] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [columnLeft, setColumnLeft] = useState([]);
  const [columnRight, setColumnRight] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);

  const getAllProductFromStore = useSelector(
    (state) => state.productState.productList
  );

  // ✅ Scroll fix: keep a ref to ScrollView and a key to force remount
  const scrollRef = useRef(null);
  const [svKey, setSvKey] = useState(0);

  const fetchWishCategoryProduct = async () => {
    try {
      const response = await axios({
        url: SummaryApi.category_wish_product.url,
        method: SummaryApi.category_wish_product.method,
        headers: {
          "content-type": "application/json",
        },
        data: {
          subCategory: subCategory,
        },
      });

      if (response.data.success) {
        setWishSubProductList(response.data.data || []);
      }
    } catch (error) {
      // console.log('Error fetching sub category product:', error.message);
    }
  };

  useEffect(() => {
    // when click in category list bar
    if (selectedCategory) {
      const categoryWise = getAllProductFromStore.filter(
        (item) =>
          item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );

      const prioritizeProducts = async () => {
        setSortedProducts(categoryWise);

        // 🧱 Split sorted products into left & right column
        const left = [],
          right = [];
        categoryWise.forEach((item, index) => {
          (index % 2 === 0 ? left : right).push(item);
        });
        setColumnLeft(left);
        setColumnRight(right);
      };

      // 👇 আপনার আগের গার্ড রাখা হলো (logic untouched)
      if (optimizedProducts.length > 0) {
        prioritizeProducts();
      }
    } else {
      fetchWishCategoryProduct();
    }
  }, [subCategory, selectedCategory]);

  // ✅ HOME-STYLE variant interleave (already your util)
  const optimizedProducts = useMemo(() => {
    const optimized = generateOptimizedVariants(wishSubProductList);
    return optimized;
  }, [wishSubProductList]); // ✅ Dependency

  useEffect(() => {
    const prioritizeProducts = async () => {
      setSortedProducts(optimizedProducts);

      // 🧱 Split sorted products into left & right column
      const left = [],
        right = [];
      optimizedProducts.forEach((item, index) => {
        (index % 2 === 0 ? left : right).push(item);
      });
      setColumnLeft(left);
      setColumnRight(right);
    };

    if (optimizedProducts.length > 0) {
      prioritizeProducts();
    }
  }, [optimizedProducts]);

  // ====== 🔧 SCROLL ISSUE FIXES (minimal) ======

  // 1) Category change → remount ScrollView + scroll to top
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSvKey((k) => k + 1); // force re-mount to drop old scroll offset
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    });
  };

  // 2) Route subCategory change → ensure top as well
  useEffect(() => {
    setSvKey((k) => k + 1); // re-mount when route changes
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    });
  }, [subCategory]);

  return (
    <View style={styles.container}>
      <SearchBar />
      {/* 🔹 Top fixed category bar */}
      <CategoryListBar onSelectCategory={handleSelectCategory} />

      {/* 🔹 Product grid section */}
      <ScrollView
        key={`sv-${selectedCategory ?? "all"}-${subCategory}-${svKey}`} // ✅ re-mount per change
        ref={scrollRef}                                                // ✅ control scroll
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {sortedProducts.length > 0 ? (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columnLeft.map((item, index) => (
                <View
                  key={(item.cardKey || item._id || "L") + "-" + index} // stable-ish key
                  style={styles.cardWrapper}
                >
                  <UserProductCart productData={item} />
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {columnRight.map((item, index) => (
                <View
                  key={(item.cardKey || item._id || "R") + "-" + index}
                  style={styles.cardWrapper}
                >
                  <UserProductCart productData={item} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.noProductText}>
            No products found in this category
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
   backgroundColor: "#F2F2F2",
    // backfaceVisibility: "#fff",
    paddingTop: 90 - 10,
    // marginBottom:44
  },
  gridContainer: {
    paddingTop: 30,
    paddingHorizontal: 5,
    paddingBottom: 60,
  },
  masonryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    // width: '49%', // two columns with gap
    // marginBottom: 7,
  },
  column: {
    width: "49.5%",
    gap: 4,
  },
  noProductText: {
    textAlign: "center",
    padding: 16,
    fontSize: 16,
    color: "#555",
  },
});

export default SubCategoryWiseProduct;
