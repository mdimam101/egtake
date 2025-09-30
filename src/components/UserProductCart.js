import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ensureHttps from "../common/ensureHttps"; // ← path adjust if needed
import * as ImageSizeCache from "../utils/imageSizeCache"; // ← path adjust if needed

const DEFAULT_RATIO = 1.2;

function UserProductCart({
  productData,
  fromDetails = false,
  disabled = false,
  pressGuard,
}) {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.49;

  const rawImageUrl =
    productData?.img || productData?.variants?.[0]?.images?.[0] || null;
  const imageUrl = ensureHttps(rawImageUrl);

  // height resolve না হওয়া পর্যন্ত null, resolve হলে পিক্সেল height
  const [resolvedHeight, setResolvedHeight] = useState(null);
  const [resolving, setResolving] = useState(true);

  // ratio resolve: cache পেলেই সাথে সাথে, না পেলে wait → তারপর দেখাও
  useEffect(() => {
    let alive = true;
    setResolving(true);
    setResolvedHeight(null);

    (async () => {
      if (!imageUrl) {
        if (!alive) return;
        setResolvedHeight(cardWidth * DEFAULT_RATIO);
        setResolving(false);
        return;
      }

      const cached = await ImageSizeCache.getCachedRatio(imageUrl);
      if (!alive) return;

      if (typeof cached === "number") {
        setResolvedHeight(cardWidth * cached);
        setResolving(false);
        return; // ✅ cached থাকলে এখানেই থামো
      }

      const fresh = await ImageSizeCache.getOrFetchRatio(imageUrl);
      if (!alive) return;

      setResolvedHeight(
        cardWidth * (typeof fresh === "number" ? fresh : DEFAULT_RATIO)
      );
      setResolving(false);
    })();

    return () => {
      alive = false;
    };
  }, [imageUrl, cardWidth]);

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

  return (
    <TouchableOpacity
      style={[styles.card, disabled && { opacity: 0.6 }]}
      onPress={handlePress}
      disabled={disabled}
    >
      {resolving ? (
        <View
          style={{
            width: "100%",
            height: cardWidth * DEFAULT_RATIO,
            borderRadius: 8,
            overflow: "hidden", // ✅
            backgroundColor: "#f2f2f2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <Image
          source={imageUrl ? { uri: imageUrl } : undefined}
          style={{
            width: "100%",
            height: resolvedHeight ?? cardWidth * DEFAULT_RATIO,
            resizeMode: "cover",
            borderRadius: 8,
          }}
          onError={() => setResolvedHeight(cardWidth * DEFAULT_RATIO)}
        />
      )}

      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>
          {productData?.productName}
        </Text>
        <Text style={styles.price}>
          <Text style={styles.tkIcon}>৳</Text>
          {productData?.selling}
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
    padding: 0,
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
    fontSize: 16,
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
