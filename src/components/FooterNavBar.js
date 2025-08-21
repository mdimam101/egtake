import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Context from "../context";

const FooterNavBar = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state?.userState?.user);
  const { cartCountProduct } = useContext(Context);
  const insets = useSafeAreaInsets();

  const currentRouteName = useNavigationState((state) => {
    if (!state || !state.routes || state.index == null) return "Home";
    return state.routes[state.index]?.name || "Home";
  });

  // const hideFooterOnRoutes = ["CheckoutPage"];
  const hideFooterOnRoutes = ["CheckoutPage", "ProductDetails"];
  if (hideFooterOnRoutes.includes(currentRouteName)) return null;

  // Only cart icon on ProductDetails screen
  if (["ProductDetails"].includes(currentRouteName))
    return (
      <View style={[styles.footerForDetails, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity onPress={() => navigation.navigate("CartPage")} style={styles.cartWrapper}>
          <View style={{ alignItems: "center" }}>
            <Ionicons name="cart-outline" size={26} color={currentRouteName === "CartPage" ? "#FF466B" : "#333"} />
          </View>
          {cartCountProduct > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCountProduct}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );

  const redirectURL = user?._id ? "Profile" : "Login";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.footer,
        {
          // bottom safe padding
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <View style={{ alignItems: "center" }}>
          <FontAwesome name="home" size={26} color={currentRouteName === "Home" ? "#FF466B" : "#333"} />
          <Text style={{ color: currentRouteName === "Home" ? "#FF466B" : "#333"}}>Home</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Category")}>
        <View style={{ alignItems: "center" }}>
          <MaterialCommunityIcons
            name="shape-outline"
            size={26}
            color={currentRouteName === "Category" ? "#FF466B" : "#333"}
          />
          <Text style={{ color: currentRouteName === "Category" ? "#FF466B" : "#333" }}>Category</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("CartPage")} style={styles.cartWrapper}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="cart-outline" size={26} color={currentRouteName === "CartPage" ? "#FF466B" : "#333"} />
          <Text style={{ color: currentRouteName === "CartPage" ? "#FF466B" : "#333" }}>Cart</Text>
        </View>
        {cartCountProduct > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCountProduct}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate(redirectURL)}>
        <View style={{ alignItems: "center" }}>
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={currentRouteName === redirectURL ? "#FF466B" : "#333"}
          />
          <Text style={{ color: currentRouteName === redirectURL ? "#FF466B" : "#333" }}>Account</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerForDetails: {
    width: 80,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 75,
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 0,
    zIndex: 99,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 80+10,
    backgroundColor: "#fff",
    borderTopColor: "#ccc",
    borderTopWidth: 1,
    elevation: 10, // Android z
    shadowColor: "#000", // iOS shadow (ignored on Android)
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    paddingTop:0
  },
  cartWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    top: -6,
    right: -12,
    backgroundColor: "#e91e63",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});

export default FooterNavBar;
