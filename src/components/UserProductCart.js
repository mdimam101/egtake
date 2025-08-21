import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NewsTickerContext } from "../context/NewsTickerContext"; // ✅ import context
import ensureHttps from "../common/ensureHttps";

const UserProductCart = ({ productData, fromDetails = false }) => {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.49;
  const [imageHeight, setImageHeight] = useState();

  const { visibleIndex, demoNews } = useContext(NewsTickerContext); // ✅ use context
  const animatedValue = useRef(new Animated.Value(0)).current;

  // const imageUrl = productData?.img
  //   ? productData?.img
  //   : productData?.variants?.[0]?.images?.[0];

  //   console.log("🦌imageUrl◆",imageUrl);

    const rawImageUrl =
   productData?.img || productData?.variants?.[0]?.images?.[0] || null;
  const imageUrl = ensureHttps(rawImageUrl);
    

  useEffect(() => {
  let mounted = true;
  if (imageUrl) {
    Image.getSize(
      imageUrl,
      //imageUrl.replace("http://", "https://"),
      (width, height) => {
        if (mounted) {
          const ratio = height / width;
          setImageHeight(cardWidth * ratio);
        }
      },
      () => { setImageHeight(cardWidth * 1.2); } // ✅ graceful fallback
    );
  }
  return () => {
    mounted = false; // ⛔ prevent memory warning
  };
}, [imageUrl]);

  // ✅ Animate global ticker
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: -visibleIndex * 20,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visibleIndex]);

  const handlePress = () => {
        console.log("🦌productData>>>>>", productData);
    const navigateMethod = fromDetails ? navigation.push : navigation.navigate;
    navigateMethod("ProductDetails", {
      id: productData._id,
      variantColor: productData.variantColor || null,
      variantSize: productData.variantSize || null,
      image: imageUrl,
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        //source={{ uri: imageUrl.replace("http://", "https://") }}
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={{
          width: "100%",
          height: imageHeight || 200,
          resizeMode: "cover",
          borderRadius: 8,
        }}
        onError={() => setImageHeight(cardWidth * 1.2)} // ✅ fallback
      />
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>
          {productData?.productName}
        </Text>
        <Text style={styles.price}>
          <Text style={styles.tkIcon}>৳</Text>
          {productData?.selling}
        </Text>
      </View>

      {/* 📰 Global news ticker scroll */}
      <View style={styles.newsBox}>
        <Animated.View
          style={[
            styles.newsContainer,
            { transform: [{ translateY: animatedValue }] },
          ]}
        >
          {demoNews.map((news, index) => (
            <View key={index} style={styles.newsSlide}>
              <Text style={styles.newsText}>{news}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

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
    marginBottom: 4, // add this for spacing
    // height: 38,
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

  // 📰 News Box Styles
  newsBox: {
    height: 20,
    overflow: "hidden",
    marginTop: 6,
    paddingLeft: 5,
  },
  newsContainer: {
    flexDirection: "column",
  },
  newsSlide: {
    height: 20,
    justifyContent: "flex-start",
  },
  newsText: {
    fontSize: 12,
    color: "#333",
  },
});

export default React.memo(UserProductCart);
