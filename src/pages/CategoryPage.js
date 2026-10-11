import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import SearchBar, { SupportSheet } from "../components/SearchBar";
import { trackBasic } from "../helper/trackBasic";

// ✅ NEW: global navigation helper (no useNavigation hook)
import { navigate } from "../common/navigationRef";
import useCategoryProducts from "../helper/useCategoryProducts";
import useProductCards from "../hooks/useProductCards";

const screenWidth = Dimensions.get("window").width;

const CategoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const isAllCategories = selectedCategory === "All";

  const [supportOpen, setSupportOpen] = useState(false);

  const categoryList = useSelector((state) => state.categoryState.categoryList);
  const {
    products: directoryProducts,
    loading: directoryLoading,
    loadingMore: directoryLoadingMore,
    error: directoryError,
    pagination: directoryPagination,
    loadMore: loadMoreCategories,
    retry: retryCategories,
  } = useProductCards({ enabled: isAllCategories, updateStore: false });
  const {
    products: categoryProducts,
    loading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory,
  } = useCategoryProducts(isAllCategories ? null : selectedCategory);

  const displayedProducts = isAllCategories
    ? directoryProducts
    : categoryProducts;
  const filteredCategories = useMemo(() => {
    const seen = new Set();
    return displayedProducts.filter((product) => {
      const name = product?.subCategory;
      if (typeof name !== "string" || !name.trim() || seen.has(name)) {
        return false;
      }
      seen.add(name);
      return true;
    });
  }, [displayedProducts]);

  const handleCategoryPress = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const handleDirectoryScroll = ({ nativeEvent }) => {
    if (
      !isAllCategories ||
      directoryLoading ||
      directoryLoadingMore ||
      directoryError ||
      !directoryPagination.hasMore
    ) {
      return;
    }
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - 300
    ) {
      loadMoreCategories();
    }
  };

  const handleSubCategory = (subcatName) => {
    const name = String(subcatName || "").trim();
    if (!name) return;

    // fire-and-forget tracking (don't block navigation)
    try {
      trackBasic("category_click", { subCategory: name.toLowerCase() });
    } catch {}

    // ✅ use global navigate (no hook)
    navigate("SubCategoryWise", { subCategory: name });
  };

  return (
    <View style={styles.mainContainer}>
      <SearchBar onOpenSupport={() => setSupportOpen(true)} />

      <View style={styles.container}>
        {/* 🔵 Sidebar category */}
        <View style={styles.sidebarBox}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Categories</Text>
            <Text style={styles.selectedCategoryText}>{selectedCategory}</Text>
          </View>

          <ScrollView
            style={styles.sidebar}
            contentContainerStyle={styles.sidebarContent}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleCategoryPress("All")}
            >
              <Text
                style={[
                  styles.sidebarItem,
                  selectedCategory === "All" && styles.activeItem,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categoryList.map((cat, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(cat.category)}
              >
                <Text
                  style={[
                    styles.sidebarItem,
                    selectedCategory === cat.category && styles.activeItem,
                  ]}
                >
                  {cat.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 🔵 Grid for subcategories */}
        <ScrollView
          contentContainerStyle={styles.gridWrapper}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          onScroll={handleDirectoryScroll}
          scrollEventThrottle={100}
        >
          {categoryLoading && <Text>Loading products...</Text>}
          {categoryError && (
            <TouchableOpacity onPress={refetchCategory}>
              <Text>Unable to fetch products. Tap to retry.</Text>
            </TouchableOpacity>
          )}
          {filteredCategories.map((subcat, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => handleSubCategory(subcat.subCategory)}
            >
              {subcat?.img ? (
                <Image
                  source={{ uri: subcat?.img.replace("http://", "https://") }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>
                    {subcat?.subCategory?.[0] || "X"}
                  </Text>
                </View>
              )}

              <Text style={styles.label} numberOfLines={2}>
                {subcat.subCategory}
              </Text>
            </TouchableOpacity>
          ))}
          {isAllCategories && (
            <View style={styles.directoryFooter}>
              {directoryLoading || directoryLoadingMore ? (
                <ActivityIndicator
                  color="#ff3f73"
                  accessibilityLabel="Loading categories"
                />
              ) : directoryError ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading categories"
                  onPress={retryCategories}
                >
                  <Text>Unable to fetch categories. Tap to retry.</Text>
                </TouchableOpacity>
              ) : directoryPagination.hasMore ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={loadMoreCategories}
                >
                  <Text>Load more categories</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>

      <SupportSheet
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </View>
  );
};

const sidebarWidth = 138;
const cardWidth = (screenWidth - sidebarWidth - 44) / 2;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: 80,
    backgroundColor: "#ffffff",
  },

  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 90,
    backgroundColor: "#ffffff",
  },

  sidebarBox: {
    width: sidebarWidth,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eeeeee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginRight: 10,
  },

  sidebarHeader: {
    paddingHorizontal: 13,
    paddingTop: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },

  sidebarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "serif",
  },

  selectedCategoryText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },

  sidebar: {
    flex: 1,
  },

  sidebarContent: {
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 20,
  },

  sidebarItem: {
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 13,
    paddingHorizontal: 13,
    color: "#1f2937",
    backgroundColor: "#f6f7f9",
    borderRadius: 13,
    marginBottom: 12,
  },

  activeItem: {
    color: "#ff3f73",
    backgroundColor: "#fff1f5",
    borderWidth: 1,
    borderColor: "#ffc2d2",
    shadowColor: "#ff3f73",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 1,
  },

  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 28,
  },

  directoryFooter: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },

  card: {
    width: cardWidth,
    minHeight: 142,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 8,
    marginBottom: 22, // ✅ gap aro beshi
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eeeeee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 9,
    elevation: 2,
  },

  image: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "#eeeeee",
    marginBottom: 11,
    backgroundColor: "#fafafa",
  },

  placeholder: {
    width: 78,
    height: 78,
    backgroundColor: "#f3f4f6",
    borderRadius: 39,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },

  placeholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6b7280",
  },

  label: {
    fontSize: 14, // ✅ subcategory text smaller
    lineHeight: 18,
    fontWeight: "400", // ✅ bold off
    color: "#111827",
    textAlign: "center",
    fontFamily: "serif",
  },
});

export default CategoryPage;
