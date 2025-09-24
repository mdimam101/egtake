import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import CartItem from "../components/CartItem";
import UserProductCart from "../components/UserProductCart";
import { GUEST_CART_KEY } from "../helper/guestCart";

// identity: productId + image + size + color (server/guest উভয় শেপেই কাজ করবে)
const getIdentity = (item) => {
  const pid =
    typeof item.productId === "object" ? item.productId?._id : item.productId;
  const image = (item.image || "").replace("https://", "http://");
  const size = (item.size || "").trim();
  const color = (item.color || "").trim();
  return `${pid}__${image}__${size}__${color}`;
};

// cache-first merge: cache আগে দেখাবে, তারপর server থেকে শুধু নতুন/updated গুলো যোগ করবে
const mergeCartArrays = (cacheArr = [], serverArr = []) => {
  const map = new Map();

  // 1) put cache first (to show instantly)
  for (const it of cacheArr) {
    map.set(getIdentity(it), it);
  }

  // 2) server wins for same identity (overwrite), or push new ones
  for (const it of serverArr) {
    map.set(getIdentity(it), it);
  }

  return Array.from(map.values());
};

const CartPage = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [unselectedItems, setUnselectedItems] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);

  const user = useSelector((state) => state?.userState?.user);

  const fetchCartItems = async () => {
    try {
      // 1) read cache first (guest বা logged-in—দুই ক্ষেত্রেই আগে UI তে দেখাও)
      const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
      const cacheArr = raw ? JSON.parse(raw) : [];
      if (cacheArr.length > 0) {
        setCartItems(cacheArr); // 👈 cache দেখালাম
      }

      // 2) guest হলে এখানেই শেষ
      if (!user?._id) return;

      // 3) logged-in হলে fresh server data আনো
      const response = await axios({
        method: SummaryApi.getCartProduct.method,
        url: SummaryApi.getCartProduct.url,
        withCredentials: true,
      });

      if (response.data?.success) {
        const serverArr = response.data.data || [];

        // ✅ push-merge: cache + server (duplicate identity হলে server version রাখবো)
        const merged = mergeCartArrays(cacheArr, serverArr);
        setCartItems(merged);
      }
    } catch {}
  };

  // check latest product for quantity check
  const fetchLatestProducts = async () => {
    try {
      const response = await axios.get(SummaryApi.get_product.url);
      if (response.data.success) {
        setLatestProducts(response.data.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCartItems();
    fetchLatestProducts();
  }, []);

  useEffect(() => {
    const updateUnselectedForOutOfStock = () => {
      const newUnselected = [...unselectedItems];

      cartItems.forEach((item) => {
        const latest = latestProducts.find((p) => p._id === item.productId._id);
        if (!latest) return;

        const variant = latest.variants.find(
          (v) => v.images?.[0] === item.image
        );
        if (!variant) return;

        const sizeKey = (item.size || "").trim().toLowerCase();
        const sizeObj = variant.sizes.find(
          (s) => (s.size || "").trim().toLowerCase() === sizeKey
        );

        const stock = sizeObj?.stock || 0;

        if (stock === 0 && !newUnselected.includes(item._id)) {
          newUnselected.push(item._id);
        }
      });

      setUnselectedItems(newUnselected);
      AsyncStorage.setItem(
        "unselected_cart_ids",
        JSON.stringify(newUnselected)
      );
    };

    if (cartItems.length > 0 && latestProducts.length > 0) {
      updateUnselectedForOutOfStock();
    }
  }, [cartItems, latestProducts]);

  const selectedItems = cartItems
    .map((item) => item._id)
    .filter((id) => !unselectedItems.includes(id));

  const findStockFromLatest = (item, latestProducts) => {
    const latest = latestProducts.find((p) => p._id === item.productId._id);
    if (!latest) return { inStock: false };

    const variant = latest.variants.find((v) => v.images?.[0] === item.image);

    if (!variant) return { inStock: false };

    if (item.size && item.size.trim() !== "") {
      const sizeObj = variant.sizes.find(
        (s) => (s.size || "").toLowerCase() === (item.size || "").toLowerCase()
      );
      if (!sizeObj || sizeObj.stock === 0) return { inStock: false };
      return {
        inStock: true,
        price: item.productId.selling || item.productId.price,
      };
    } else {
      const totalStock = variant.sizes.reduce(
        (sum, s) => sum + (s.stock || 0),
        0
      );
      if (totalStock === 0) return { inStock: false };
      return {
        inStock: true,
        price: item.productId.selling || item.productId.price,
      };
    }
  };

  const totalAmount = cartItems
    .filter((item) => {
      const result = findStockFromLatest(item, latestProducts);
      return result.inStock && selectedItems.includes(item._id);
    })
    .reduce((acc, item) => {
      const result = findStockFromLatest(item, latestProducts);
      return acc + result.price * item.Quantity;
    }, 0);

  const totalSaved = cartItems
    .filter((item) => {
      const result = findStockFromLatest(item, latestProducts);
      return result.inStock && selectedItems.includes(item._id);
    })
    .reduce((acc, item) => {
      const original = item?.productId?.price || 0;
      const sell = item?.productId?.selling || 0;
      return acc + (original - sell) * item.Quantity;
    }, 0);

  const handleCheckout = () => {
    // console.log("◆◆handleCheckout◆_______：");

    const selectedItemsDetails = cartItems.filter((item) => {
      const result = findStockFromLatest(item, latestProducts);
      return result.inStock && selectedItems.includes(item._id);
    });
    // console.log("🦌🦌selectedItemsDetails🦌🦌", selectedItemsDetails);

    navigation.navigate("CheckoutPage", { selectedItemsDetails });
  };

  const toggleSelect = async (itemId) => {
    let updatedUnselected = [];

    if (unselectedItems.includes(itemId)) {
      updatedUnselected = unselectedItems.filter((id) => id !== itemId);
    } else {
      updatedUnselected = [...unselectedItems, itemId];
    }

    setUnselectedItems(updatedUnselected);
    await AsyncStorage.setItem(
      "unselected_cart_ids",
      JSON.stringify(updatedUnselected)
    );
  };

  const toggleSelectAll = () => {
    if (unselectedItems.length === 0) {
      const allIds = cartItems.map((item) => item._id);
      setUnselectedItems(allIds);
    } else {
      setUnselectedItems([]);
    }
  };

  useEffect(() => {
    const loadUnselectedFromStorage = async () => {
      const stored = await AsyncStorage.getItem("unselected_cart_ids");
      if (stored) {
        setUnselectedItems(JSON.parse(stored));
      }
    };

    loadUnselectedFromStorage();
    if (user?._id) {
      fetchCartItems();
    }
    fetchLatestProducts();
  }, []);

  const allSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Your Cart</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        style={{ flex: 1 }}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Start shopping and fill it up!
            </Text>
          </View>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={`${item?._id}_${item?.addedAt}`} //✅ unique key
              product={item}
              refreshCart={fetchCartItems}
              latestProducts={latestProducts}
              isSelected={!unselectedItems.includes(item._id)}
              toggleSelect={() => toggleSelect(item._id)}
              // availableStock={getAvailableStock(item)}
            />
          ))
        )}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.heading}>🛍 Recommended</Text>
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {latestProducts
                .filter((_, idx) => idx % 2 === 0)
                .map((item, index) => (
                  <View key={index} style={styles.cardWrapper}>
                    <UserProductCart productData={item} />
                  </View>
                ))}
            </View>
            <View style={styles.column}>
              {latestProducts
                .filter((_, idx) => idx % 2 !== 0)
                .map((item, index) => (
                  <View key={index} style={styles.cardWrapper}>
                    <UserProductCart productData={item} />
                  </View>
                ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.checkoutBar}>
          <TouchableOpacity
            onPress={toggleSelectAll}
            style={styles.selectAllRow}
          >
            <View
              style={[styles.checkbox, allSelected ? styles.checked : null]}
            >
              {allSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>All</Text>
          </TouchableOpacity>

          <View style={styles.priceSummary}>
            <Text style={styles.totalText}>৳{totalAmount}</Text>
            <Text style={styles.saveText}>Saved: ৳{totalSaved}</Text>
          </View>

          {selectedItems.length > 0 && (
            <TouchableOpacity
              onPress={handleCheckout}
              style={styles.checkoutBtn}
            >
              <Text style={styles.checkoutText}>
                Checkout ({selectedItems.length})
              </Text>
              {/* <Text style={styles.checkoutNote}>⏳ Almost sold out!</Text> */}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default CartPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    paddingBottom: 30,
    backgroundColor: "#F2F2F2",
    marginBottom: 30,
  },
  header: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    backfaceVisibility: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  masonryContainer: {
    marginBottom: 60,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    // width: "48%",
    // marginBottom: 16,
  },
  column: {
    width: "49.5%",
    gap: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#777",
    marginBottom: 16,
    textAlign: "center",
  },

  checkoutBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 3 + 2,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 25 + 3,
    left: 0,
    right: 0,
    zIndex: 999,
    gap: 20,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkIcon: {
    fontSize: 20,
    color: "#e53935",
    fontWeight: "bold",
  },
  checkText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  priceSummary: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  saveText: {
    fontSize: 14,
    color: "#e53935",
    fontWeight: "600",
  },
  checkoutBtn: {
    backgroundColor: "#ff2c55",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  //   checkoutNote: {
  //     fontSize: 12,
  //     color: '#fff',
  //     marginTop: 2,
  //   },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f44336",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checked: {
    backgroundColor: "#f44336",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 18,
  },
});
