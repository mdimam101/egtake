import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import axios from "axios";
import SummaryApi from "../common/SummaryApi";
import { useDispatch, useSelector } from "react-redux";
import { setCategoryList } from "../store/categorySlice";
import SkeletonCategoryBar from "./SkeletonCategoryBar";

const CategoryListBar = ({ onSelectCategory, /*subCategory = "ALL"}*/}) => {
  const subCategory = "ALL" // next i will solve it now just for test
  const [categories, setCategories] = useState([]);
  const getcategoryListFromStore = useSelector((state) => state.categoryState.categoryList);
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(subCategory);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SummaryApi.category_product.url);
      if (res.data.success) {
        const categoryList = res.data.data || [];
        // setCategory in store
        dispatch(setCategoryList(res.data?.data));
        // 1st time
        setCategories([{ category: subCategory }, ...categoryList]); // ✅ prepend All
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    if (getcategoryListFromStore.length === 0) {
      fetchCategories();
    } else {
      setCategories([{ category: subCategory }, ...getcategoryListFromStore]);
      setLoading(false);
    }
  }, []);

  return loading ? (
    <SkeletonCategoryBar />
  ) : (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryItem,
              selected === cat.category && styles.categoryItemSelected,
            ]}
            onPress={() => {
              const selectedCat = cat.category;
              setSelected(selectedCat);
              selectedCat === subCategory
                ? onSelectCategory(null)
                : onSelectCategory(selectedCat);
            }}
          >
            <Text
              style={[
                styles.text,
                selected === cat.category && {
                  color: "#fff",
                  fontWeight: "600",
                },
              ]}
            >
              {cat.category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 95-15,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    paddingVertical: 1,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f3f3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    color: "#333",
  },
  categoryItemSelected: {
    backgroundColor: "#FF466B",
    borderColor: "#FF466B",
  },
});

export default CategoryListBar;
