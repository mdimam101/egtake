// components/SkeletonCategoryBar.js
import { StyleSheet, View } from "react-native";

const SkeletonCategoryBar = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.scrollContainer}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.skeletonItem} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 95 - 14,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    paddingVertical: 1,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  scrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  skeletonItem: {
    width: 80,
    height: 30,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 10,
  },
});

export default SkeletonCategoryBar;
