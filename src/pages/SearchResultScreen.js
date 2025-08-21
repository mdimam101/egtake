import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import SummaryApi from "../common/SummaryApi";
import UserProductCart from "../components/UserProductCart";
import { Ionicons } from "@expo/vector-icons";
import SearchBar from "../components/SearchBar";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";

const screenWidth = Dimensions.get("window").width;

const SearchResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme(); // 🌙 detect dark mode
  const isDarkMode = colorScheme === "dark";

  const query = decodeURIComponent(route.params?.query || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPrice, setFilterPrice] = useState(null); // ⏬ eg. 500, 1000
  const [sortedProducts, setSortedProducts] = useState([]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${SummaryApi.searchProduct.url}?q=${query}`);
        if (res.data.success) {
          setProducts(res.data.data || []);
        }
      } catch (err) {
        // console.error("Search failed", err.message);
      }
      setLoading(false);
    };
    fetchSearchResults();
  }, [query]);

        
      const optimizedProducts = useMemo(() => {
        const result = [];
        const variantGroups = [];
      
        products.forEach((item) => {
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
      }, [products]); // ✅ Dependency
      
      useEffect(() => {
        const prioritizeProducts = async () => {
          const sorted = await sortProductsByUserInterest(optimizedProducts);
          setSortedProducts(sorted);
        };
      
        if (optimizedProducts.length > 0) {
          prioritizeProducts();
        }
      }, [optimizedProducts]);

  const filteredProducts = filterPrice
    ? sortedProducts.filter((item) => item.selling <= filterPrice)
    : sortedProducts;

  const columnLeft = filteredProducts.filter((_, i) => i % 2 === 0);
  const columnRight = filteredProducts.filter((_, i) => i % 2 !== 0);

  return (
    <View style={styles.container}>
       <SearchBar />
    <ScrollView
      style={[
        styles.scrollContainer,
        { backgroundColor: isDarkMode ? "#dad3c5" : "#fff" },
      ]}
    >
      {/* 🔙 Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>
          Results for: <Text style={{ color: "#e91e63" }}>{query}</Text>
        </Text>
      </View> */}

      {/* 🔘 Filter Buttons */}
      <View style={styles.filterRow}>
        {[null, 99, 500, 1000].map((price, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setFilterPrice(price)}
            style={[
              styles.filterBtn,
              filterPrice === price && { backgroundColor: "#e91e63" },
            ]}
          >
            <Text
              style={{
                color: filterPrice === price ? "#fff" : isDarkMode ? "#ccc" : "#333",
                fontSize: 13,
              }}
            >
              {price === null ? "All" : `৳${price} or less`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔄 Products */}
      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" style={{ marginTop: 20 }} />
      ) : filteredProducts.length === 0 ? (
        <Text style={[styles.empty, { color: isDarkMode ? "#888" : "#555" }]}>
          No products found.
        </Text>
      ) : (
        <View style={styles.masonry}>
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
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 95,
    // backgroundColor: "#fff",
    backfaceVisibility:"#dad3c5"
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 12,
    marginBottom:75
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    flexWrap: "wrap",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  masonry: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: (screenWidth - 30) / 2,
  },
  cardWrapper: {
    marginBottom: 6,
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
  },
});

export default SearchResultScreen;
