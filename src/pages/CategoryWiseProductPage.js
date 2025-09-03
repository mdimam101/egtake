import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SummaryApi from "../common/SummaryApi";
import UserProductCart from "../components/UserProductCart";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";
import { generateOptimizedVariants } from "../helper/variantUtils";

const screenWidth = Dimensions.get("window").width;

const CategoryWiseProductPage = ({ route }) => {
  const { categoryName } = route.params;
  const [wishProductList, setWishProductList] = useState([]);
   const [sortedProducts, setSortedProducts] = useState([]);

  const fetchWishCategoryProduct = async () => {
    try {
      const res = await axios({
        method: SummaryApi.category_wish_product.method,
        url: SummaryApi.category_wish_product.url,
        data: { category: categoryName },
        headers: { "content-type": "application/json" },
      });

      if (res.data.success) {
        setWishProductList(res.data.data || []);
      }
    } catch (error) {
      // console.log("❌ Error fetching category product:", error.message);
    }
  };

  useEffect(() => {
    fetchWishCategoryProduct();
  }, [categoryName]);

  // ✅ HOME-STYLE: সব variants interleave + no-variant fallback
  const optimizedProducts = useMemo(() => {
   const optimizedProductsResult = generateOptimizedVariants(wishProductList);
    return optimizedProductsResult;
  }, [wishProductList]); // ✅ Dependency ঠিক আছে 

  useEffect(() => {
    const prioritizeProducts = async () => {
      const sorted = await sortProductsByUserInterest(optimizedProducts);
      setSortedProducts(sorted);
    };

    if (optimizedProducts.length > 0) {
      prioritizeProducts();
    } else {
      setSortedProducts([]); // clear when empty
    }
  }, [optimizedProducts]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Category: {categoryName}</Text>

      <View style={styles.grid}>
        {sortedProducts.length === 0 ? (
          <Text style={styles.empty}>No products found</Text>
        ) : (
          sortedProducts.map((product, idx) => (
            <View key={idx} style={styles.card}>
              <UserProductCart productData={product} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    // backfaceVisibility: "#fff",
    padding: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: (screenWidth - 30) / 2,
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    padding: 20,
    color: "#777",
  },
});

export default CategoryWiseProductPage;
