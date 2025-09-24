import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Context from "../context";

const FooterNavBar = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state?.userState?.user);
  const { cartCountProduct } = useContext(Context);

  // const currentRouteName = useNavigationState((state) => {
  //   if (!state || !state.routes || state.index == null) return "Home";
  //   return state.routes[state.index]?.name || "Home";
  // });
  const { currentRouteName } = useContext(Context);

  // ❗️এখানে ProductDetails ইতিমধ্যে hide করা, তাই নিচের “Only cart icon…” ব্লকটা কখনো চলবে না।
  const hideFooterOnRoutes = ["CheckoutPage", "ProductDetails"];
  if (hideFooterOnRoutes.includes(currentRouteName)) return null;

  const redirectURL = user?._id ? "Profile" : "Signup";

  // helper: কোন বাটন active
  const isActive = (name) => currentRouteName === name;

  return (
    <View pointerEvents="box-none" style={styles.footer}>
      {/* Home */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        disabled={isActive("Home")}                       // ← এখনকার রুট হলে disabled
      >
        <View style={{ alignItems: "center" }}>
          <FontAwesome
            name="home"
            size={26}
            color={isActive("Home") ? "#FF466B" : "#333"}  // রঙ আগের মতই
          />
          <Text style={{ color: isActive("Home") ? "#FF466B" : "#333" }}>Home</Text>
        </View>
      </TouchableOpacity>

      {/* Category */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Category")}
        disabled={isActive("Category")}
      >
        <View style={{ alignItems: "center" }}>
          <MaterialCommunityIcons
            name="shape-outline"
            size={26}
            color={isActive("Category") ? "#FF466B" : "#333"}
          />
          <Text style={{ color: isActive("Category") ? "#FF466B" : "#333" }}>Category</Text>
        </View>
      </TouchableOpacity>

      {/* Cart */}
      <TouchableOpacity
        onPress={() => navigation.navigate("CartPage")}
        style={styles.cartWrapper}
        disabled={isActive("CartPage")}
      >
        <View style={{ alignItems: "center" }}>
          <Ionicons
            name="cart-outline"
            size={26}
            color={isActive("CartPage") ? "#FF466B" : "#333"}
          />
          <Text style={{ color: isActive("CartPage") ? "#FF466B" : "#333" }}>Cart</Text>
        </View>
        {cartCountProduct > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCountProduct}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Account (Profile/Signup) */}
      <TouchableOpacity
        onPress={() => navigation.navigate(redirectURL)}
        disabled={isActive(redirectURL)}
      >
        <View style={{ alignItems: "center" }}>
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={isActive(redirectURL) ? "#FF466B" : "#333"}
          />
          <Text style={{ color: isActive(redirectURL) ? "#FF466B" : "#333" }}>Account</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // footerForDetails: {
  //   width: 80,
  //   flexDirection: "row",
  //   justifyContent: "space-around",
  //   alignItems: "center",
  //   height: 55,
  //   position: "absolute",
  //   bottom: 0,
  //   left: 20,
  //   right: 0,
  //   zIndex: 99,
  //   backgroundColor: "#fff",
  //   elevation: 8,
  //   shadowColor: "#000",
  //   shadowOpacity: 0.08,
  //   shadowRadius: 8,
  //   shadowOffset: { width: 0, height: -2 },
  // },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 55,
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
