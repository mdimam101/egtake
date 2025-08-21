import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ensureHttps from "../common/ensureHttps";

const UserSlideProductCard = ({
  productData,
  isLast = false,
  onViewMorePress,
}) => {
  const navigation = useNavigation();

  if (isLast) {
    return (
      <TouchableOpacity style={styles.card} onPress={onViewMorePress}>
        <View style={styles.moreBox}>
          <Text style={styles.moreIcon}>→</Text>
          <Text style={styles.moreText}>View More</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ProductDetails", {
          id: productData._id,
          variantColor: productData.variantColor || null,
          variantSize: productData.variantSize || null,
          // image: productData?.img,
           image: ensureHttps(productData?.img),
        })
      }
      style={styles.card}
    >
      <Image
        //source={{ uri: productData?.img.replace("http://", "https://") }}
        source={
          productData?.img ? { uri: ensureHttps(productData?.img) } : undefined
        }
        style={styles.image}
      />
      <Text style={styles.price}>৳{productData?.selling}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 115,
    marginRight: 2,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    overflow: "hidden", // 👈 ensures image doesn't overflow
    // marginLeft:0
  },
  image: {
    width: "100%",
    height: 130,
    borderRadius: 6,
    resizeMode: "cover",
  },
  price: {
    fontSize: 16,
    color: "#ff5722", // orange/red
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  moreBox: {
    width: "100%",
    height: 120,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  moreIcon: {
    fontSize: 28,
    color: "#999",
  },
  moreText: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
});

export default React.memo(UserSlideProductCard);
