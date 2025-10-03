import { useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import SummaryApi from "../common/SummaryApi";
import SearchBar, { SupportSheet } from "../components/SearchBar";
import UserProductCart from "../components/UserProductCart";
import { sortProductsByUserInterest } from "../helper/sortByUserInterest";
import { generateOptimizedVariants } from "../helper/variantUtils";

const SearchResultScreen = () => {
  const route = useRoute();
  const colorScheme = useColorScheme(); // 🌙 detect dark mode
  const isDarkMode = colorScheme === "dark";

  const query = decodeURIComponent(route.params?.query || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPrice, setFilterPrice] = useState(null); // ⏬ eg. 500, 1000
  const [sortedProducts, setSortedProducts] = useState([]);
  const [supportOpen, setSupportOpen] = useState(false);

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
      const optimizedProductsResult = generateOptimizedVariants(products)
        return optimizedProductsResult;
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
        <SearchBar  onOpenSupport={() => setSupportOpen(true)}/>
    <ScrollView
      style={[
        styles.scrollContainer,
        { backgroundColor: isDarkMode ? "#dad3c5" : "#fff" },
      ]}
    >

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
              {price === null ? "All" : `৳1~৳${price}`}
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
     {/* visible support modal*/}
          <SupportSheet visible={supportOpen} onClose={() => setSupportOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 95-15,
    backgroundColor: "##dad3c5",
    // backfaceVisibility:"#dad3c5"
  },
  scrollContainer: {
    paddingTop: 2,
    paddingHorizontal: 3,
    marginBottom:55
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
    marginBottom: 5,
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
    // width: (screenWidth - 30) / 2,
    width: "49.5%" 
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
