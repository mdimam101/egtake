import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import axios from "axios";
import SummaryApi from "../common/SummaryApi";
import UserProductCart from "../components/UserProductCart";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";

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

    
  const optimizedProducts = useMemo(() => {
    const result = [];
    const variantGroups = [];
  
    wishProductList.forEach((item) => {
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
  }, [wishProductList]); // ✅ Dependency
  
  useEffect(() => {
    const prioritizeProducts = async () => {
      const sorted = await sortProductsByUserInterest(optimizedProducts);
      setSortedProducts(sorted);
    };
  
    if (optimizedProducts.length > 0) {
      prioritizeProducts();
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
    // backgroundColor: "#fff",
    backfaceVisibility:"#fff",
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
