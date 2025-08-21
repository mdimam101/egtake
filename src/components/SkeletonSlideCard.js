// components/SkeletonSlideCard.js
import React from "react";
import { View, StyleSheet } from "react-native";

const SkeletonSlideCard = () => {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.priceLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 115,
    height: 170,
    marginRight: 2,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 130,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  priceLine: {
    width: "60%",
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginTop: 10,
  },
});

export default React.memo(SkeletonSlideCard);
