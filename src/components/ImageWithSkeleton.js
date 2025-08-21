// components/ImageWithSkeleton.js
import React, { useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";

const ImageWithSkeleton = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[style, { backgroundColor: "#f0f0f0" }]}>
      {!loaded && (
        <View style={[styles.skeleton, style]}>
          <ActivityIndicator size="small" color="#ccc" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[style, { position: "absolute", opacity: loaded ? 1 : 0 }]}
        resizeMode="contain"
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ImageWithSkeleton;
