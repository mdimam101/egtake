import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;
const cardWidth = screenWidth * 0.47;

const SkeletonCard = () => {
  return (
    <View style={styles.card}>
      {/* Image placeholder */}
      <View style={styles.image} />

      {/* Info section (Product Name + Price) */}
      <View style={styles.info}>
        <View style={styles.textLine} />
        <View style={[styles.textLine, { width: "40%" }]} />
      </View>

      {/* News Box placeholder */}
      <View style={styles.newsBox}>
        <View style={styles.newsSlide} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  info: {
    marginTop: 8,
    paddingLeft: 5,
  },
  textLine: {
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 6,
    marginBottom: 6,
  },
  newsBox: {
    height: 20,
    overflow: "hidden",
    marginTop: 6,
    paddingLeft: 5,
  },
  newsSlide: {
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 6,
    width: "50%",
  },
});

export default React.memo(SkeletonCard);
