import axios, { isCancel } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import SummaryApi from "../common/SummaryApi";
import CategoryListBar from "../components/CategoryListBar"; // same as homepage top bar
import SearchBar from "../components/SearchBar";
import UserProductCart from "../components/UserProductCart";
import useCategoryProducts from "../helper/useCategoryProducts";
import { generateOptimizedVariants } from "../helper/variantUtils";

const SubCategoryWiseProduct = ({ route }) => {
  const { subCategory } = route.params; // ✅ React Native equivalent of useParams()
  const [subCategoryResult, setSubCategoryResult] = useState({
    subCategory: null,
    products: [],
    error: null,
  });

  const [selectedCategory, setSelectedCategory] = useState(null);

  const {
    products: categoryProducts,
    loading: categoryLoading,
    error: categoryError,
  } = useCategoryProducts(selectedCategory);

  // ✅ Scroll fix: keep a ref to ScrollView and a key to force remount
  const scrollRef = useRef(null);
  const [svKey, setSvKey] = useState(0);

  useEffect(() => {
    if (selectedCategory) return undefined;

    const controller = new AbortController();
    const fetchWishCategoryProduct = async () => {
      try {
        const response = await axios({
          url: SummaryApi.category_wish_product.url,
          method: SummaryApi.category_wish_product.method,
          headers: {
            "x-client-key": process.env.EXPO_PUBLIC_CLIENT_KEY,
            "content-type": "application/json",
          },
          data: { subCategory },
          signal: controller.signal,
        });

        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error(
            response.data?.message || "Unable to fetch subcategory products",
          );
        }
        if (!controller.signal.aborted) {
          setSubCategoryResult({
            subCategory,
            products: response.data.data,
            error: null,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted && !isCancel(error)) {
          setSubCategoryResult({
            subCategory,
            products: [],
            error: error.message || "Unable to fetch subcategory products",
          });
        }
      }
    };

    fetchWishCategoryProduct();
    return () => controller.abort();
  }, [subCategory, selectedCategory]);

  // A delayed subcategory response cannot replace a selected category's list.
  const sortedProducts = useMemo(
    () =>
      selectedCategory
        ? categoryProducts
        : generateOptimizedVariants(
            subCategoryResult.subCategory === subCategory
              ? subCategoryResult.products
              : [],
          ),
    [selectedCategory, categoryProducts, subCategoryResult, subCategory],
  );
  const columnLeft = useMemo(
    () => sortedProducts.filter((_, index) => index % 2 === 0),
    [sortedProducts],
  );
  const columnRight = useMemo(
    () => sortedProducts.filter((_, index) => index % 2 !== 0),
    [sortedProducts],
  );
  const loading = selectedCategory
    ? categoryLoading
    : subCategoryResult.subCategory !== subCategory;
  const error = selectedCategory
    ? categoryError
    : subCategoryResult.subCategory === subCategory
      ? subCategoryResult.error
      : null;

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
        ref={scrollRef} // ✅ control scroll
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
            {loading
              ? "Loading products..."
              : error
                ? "Unable to fetch products"
                : "No products found in this category"}
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
