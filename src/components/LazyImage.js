// components/LazyImage.js
import React, { useState } from "react";
import { Image, View, ActivityIndicator, StyleSheet } from "react-native";

const LazyImage = ({ source, style }) => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loader]}>
          <ActivityIndicator size="small" color="#aaa" />
        </View>
      )}
      <Image
        source={{ uri: source }}
        style={[style, loading && { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
};

export default LazyImage;

const styles = StyleSheet.create({
  loader: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
