import { useNavigation } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ensureHttps from "../common/ensureHttps";

const UserSlideProductCard = ({
  productData,
  isLast = false,
  onViewMorePress,
  disabled = false,
  pressGuard,
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

  const imgUri = ensureHttps(productData?.img);

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() =>
        !disabled &&
        (!pressGuard || pressGuard(productData?._id)) &&
        navigation.navigate("ProductDetails", {
          id: productData._id,
          variantColor: productData.variantColor || null,
          variantSize: productData.variantSize || null,
          image: imgUri,
        })
      }
      style={[styles.card, disabled && { opacity: 0.6 }]}
    >
      <ExpoImage
        source={imgUri ? { uri: imgUri } : null}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
        recyclingKey={productData?.cardKey || productData?._id}
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
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 130,
    borderRadius: 6,
    resizeMode: "cover",
  },
  price: {
    fontSize: 16,
    color: "#ff5722",
    fontWeight: "bold",
    marginTop: 1,
    textAlign: "center",
  },
  moreBox: {
    width: "100%",
    height: 130,
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
