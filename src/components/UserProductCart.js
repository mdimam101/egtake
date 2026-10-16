import { useNavigation } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ensureHttps from "../common/ensureHttps"; // ← path adjust if needed

const DEFAULT_ASPECT_RATIO = 1 / 1.2;

function UserProductCart({
  productData,
  fromDetails = false,
  disabled = false,
  pressGuard,
}) {
  const navigation = useNavigation();

  const rawImageUrl =
    productData?.img || productData?.variants?.[0]?.images?.[0] || null;
  const imageUrl = React.useMemo(() => ensureHttps(rawImageUrl), [rawImageUrl]);

  const preparedAspectRatio = Number(productData?.imageAspectRatio);
  const validPreparedAspectRatio =
    Number.isFinite(preparedAspectRatio) && preparedAspectRatio > 0
      ? preparedAspectRatio
      : null;
  const [ratioState, setRatioState] = useState({
    url: null,
    value: null,
  });
  const loadedAspectRatio =
    ratioState.url === imageUrl ? ratioState.value : null;
  const imageAspectRatio =
    loadedAspectRatio || validPreparedAspectRatio || DEFAULT_ASPECT_RATIO;

  const handleImageLoad = useCallback(
    (event) => {
      const width = Number(event?.source?.width);
      const height = Number(event?.source?.height);
      if (!imageUrl || width <= 0 || height <= 0) return;

      const ratio = width / height;
      if (!Number.isFinite(ratio) || ratio <= 0) return;

      setRatioState({ url: imageUrl, value: ratio });
    },
    [imageUrl],
  );

  const handlePress = () => {
    if (disabled) return;
    if (pressGuard && !pressGuard(productData?._id)) return;

    const navigateMethod = fromDetails ? navigation.push : navigation.navigate;
    navigateMethod("ProductDetails", {
      id: productData._id,
      variantColor: productData.variantColor || null,
      variantSize: productData.variantSize || null,
      image: imageUrl,
    });
  };

  let productName = productData?.spcProductName || productData?.productName;
  let selling = productData?.spcSelling || productData?.selling;

  return (
    <TouchableOpacity
      style={[styles.card, disabled && { opacity: 0.6 }]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={productData?.productName || "Product"}
      accessibilityState={{ disabled }}
    >
      <ExpoImage
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={[styles.image, { aspectRatio: imageAspectRatio }]}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
        allowDownscaling
        recycleMemory
        recyclingKey={productData?.cardKey || productData?._id || imageUrl}
        onLoad={handleImageLoad}
      />
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>
          {productName}
        </Text>
        <Text style={styles.price}>
          <Text style={styles.tkIcon}>৳</Text>
          {selling}
        </Text>
      </View>
      {/* চাইলে এখানে news ticker / extra UI যোগ করো */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 0,
    paddingBottom: 8,
  },
  image: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },
  info: {
    marginTop: 8,
    paddingLeft: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#e91e63",
  },
  tkIcon: {
    fontSize: 16,
    fontWeight: "normal",
    marginRight: 2,
  },
});

export default React.memo(UserProductCart);
