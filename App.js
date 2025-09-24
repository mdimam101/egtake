// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import axios from "axios";
import { useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";

// Redux
import store from "./src/store/store";
import { setUserDetails } from "./src/store/userSlice";

// Contexts
import Context from "./src/context";
import CartProvider from "./src/context/CartContext";
import { NewsTickerProvider } from "./src/context/NewsTickerContext";

// Pages
import CartPage from "./src/pages/CartPage";
import CategoryPage from "./src/pages/CategoryPage";
import CategoryWiseProductPage from "./src/pages/CategoryWiseProductPage";
import CheckoutPage from "./src/pages/CheckoutPage";
import ForgotPasswordPage from "./src/pages/ForgotPasswordPage";
import HomePage from "./src/pages/HomePage";
import LoginPage from "./src/pages/LoginPage";
import ProductDetails from "./src/pages/ProductDetails";
import ProfilePage from "./src/pages/ProfilePage";
import SearchResultScreen from "./src/pages/SearchResultScreen";
import SignupPage from "./src/pages/Signup";
import SubCategoryWiseProduct from "./src/pages/SubCategoryWiseProduct";

// Components
import Toast from "react-native-toast-message";
import FooterNavBar from "./src/components/FooterNavBar";

// Others
import SummaryApi from "./src/common/SummaryApi";
import ReviewsScreen from "./src/screens/ReviewsScreen";

import { trackBasic } from "./src/helper/trackBasic";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { navigationRef } from "./src/common/navigationRef"; // না থাকলে createNavigationContainerRef দিয়ে বানাও
import { GUEST_CART_KEY } from "./src/helper/guestCart";

const Stack = createNativeStackNavigator();

const AppWrapper = () => {
  const dispatch = useDispatch();
  const [cartCountProduct, setCartCountProduct] = useState(0);
  const [cartListData, setCartListData] = useState([]);
  const user = useSelector((state) => state?.userState?.user);
  const [currentRouteName, setCurrentRouteName] = useState("Home");

  const fetchUserDetails = async () => {
    try {
      const response = await axios({
        method: SummaryApi.current_user.method,
        url: SummaryApi.current_user.url,
        withCredentials: true,
      });
      const result = response.data;
      if (result.success) {
        dispatch(setUserDetails(result.data));
        setCartListData(result.data);
      }
    } catch (error) {}
  };

  const fetchUserAddToCart = async (isLogin = false) => {
    const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
    const cacheArr = raw ? JSON.parse(raw) : [];

    let localStoreDataCount = 0;
    let serverSaveDataCount = 0;

    if (cacheArr?.length >= 1) {
      localStoreDataCount = cacheArr?.length;
    }

    try {
      if (user?._id) {
        const response = await axios({
          method: SummaryApi.count_AddToCart_Product.method,
          url: SummaryApi.count_AddToCart_Product.url,
          withCredentials: true,
        });
        const result = response.data;
        if (result?.data?.count) {
          serverSaveDataCount = Number(result?.data?.count);
        }
      }
    } catch (err) {
      //setCartCountProduct(0);
    } finally {
      const totalCount = localStoreDataCount + serverSaveDataCount;
      if (totalCount) {
        setCartCountProduct(totalCount);
      } else {
        setCartCountProduct(0);
      }
    }
  };

  useEffect(() => {
    if (!user?._id) fetchUserDetails();
    if (user?._id) fetchUserAddToCart(true);
    else fetchUserAddToCart(false);
  }, [user?._id]);

  trackBasic("visit_app");
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync("#fff"); // পুরো সিস্টেম UI bg
    }
  }, []);
  return (
    <NewsTickerProvider>
      <Context.Provider
        value={{
          fetchUserDetails,
          cartCountProduct,
          fetchUserAddToCart,
          cartListData,
          currentRouteName,
        }}
      >
        {/* <GestureHandlerRootView style={{ flex: 1 }}> */}
        {/* ✅ Make status bar icons dark on white background */}
        {/* <StatusBar style="dark" backgroundColor="#F2F2F2" /> */}
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            const r = navigationRef.getCurrentRoute?.();
            if (r?.name) setCurrentRouteName(r.name);
          }}
          onStateChange={() => {
            const r = navigationRef.getCurrentRoute?.();
            if (r?.name) setCurrentRouteName(r.name);
          }}
        >
          <View style={[styles.wrapper]}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {/* <Stack.Navigator> */}
              <Stack.Screen name="Home" component={HomePage} />
              <Stack.Screen name="ProductDetails" component={ProductDetails} />
              <Stack.Screen name="Reviews" component={ReviewsScreen} />
              <Stack.Screen name="Category" component={CategoryPage} />
              <Stack.Screen
                name="CategoryWise"
                component={CategoryWiseProductPage}
              />
              <Stack.Screen
                name="SubCategoryWise"
                component={SubCategoryWiseProduct}
              />
              <Stack.Screen
                name="SearchResult"
                component={SearchResultScreen}
              />
              <Stack.Screen name="Signup" component={SignupPage} />
              <Stack.Screen name="Login" component={LoginPage} />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordPage}
              />
              <Stack.Screen name="Profile" component={ProfilePage} />
              <Stack.Screen name="CartPage" component={CartPage} />
              <Stack.Screen name="CheckoutPage" component={CheckoutPage} />
            </Stack.Navigator>
            <FooterNavBar />
          </View>
          <Toast />
        </NavigationContainer>
        {/* </GestureHandlerRootView> */}
      </Context.Provider>
    </NewsTickerProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <CartProvider>
        {/* <SafeAreaProvider> */}
        <AppWrapper />
        {/* </SafeAreaProvider> */}
      </CartProvider>
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backfaceVisibility: "#fff",
    marginBottom: 44,
    padding: 0,
  },
});
