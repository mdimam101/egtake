import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import SummaryApi from "../common/SummaryApi";
import UserProductCart from "../components/UserProductCart";
import CategoryListBar from "../components/CategoryListBar"; // same as homepage top bar
import SearchBar from "../components/SearchBar";
import { useSelector } from "react-redux";

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
// console.log("🦌subCategory", subCategory);

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
      // console.log("filtered:", selectedCategory, categoryWise);
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

      if (optimizedProducts.length > 0) {
        prioritizeProducts();
      }
    } else {
      fetchWishCategoryProduct();
    }
  }, [subCategory, selectedCategory]);

  const optimizedProducts = useMemo(() => {
    const result = [];
    const variantGroups = [];
    wishSubProductList.forEach((item) => {
      const variants = item.variants || [];
      let maxShow = 1;
      if (variants.length >= 7) maxShow = 4;
      else if (variants.length >= 5) maxShow = 3;
      else if (variants.length >= 3) maxShow = 2;

      for (let i = 0; i < Math.min(maxShow, variants.length); i++) {
        if (!variantGroups[i]) variantGroups[i] = [];
        variantGroups[i].push({
          _id: item._id,
          productName: item.productName,
          selling: item.selling,
          category: item.category,
          subCategory: item.subCategory,
          img: variants[i]?.images?.[0],
          variantColor: variants[i]?.color || null,
          trandingProduct: item.trandingProduct,
        });
      }
    });

    variantGroups.forEach((group) => {
      result.push(...group);
    });

    return result;
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

  return (
    <View style={styles.container}>
      <SearchBar />
      {/* 🔹 Top fixed category bar */}
      <CategoryListBar //subCategory={subCategory} // or dynamic from route.params.subCategory
      onSelectCategory={(cat) => setSelectedCategory(cat)} />

      {/* 🔹 Product grid section */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {sortedProducts.length > 0 ? (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columnLeft.map((item, index) => (
                <View key={index} style={styles.cardWrapper}>
                  <UserProductCart productData={item} />
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {columnRight.map((item, index) => (
                <View key={index} style={styles.cardWrapper}>
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
    // backgroundColor: '#fff',
    backfaceVisibility: "#fff",
    paddingTop: 90-10,
  },
  gridContainer: {
    paddingTop: 40,
    paddingHorizontal: 10,
    paddingBottom: 80,
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
