import { useNavigation } from "@react-navigation/native";
import { memo, useContext, useRef } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ensureHttps from "../common/ensureHttps";
import { canon } from "../common/urlUtils";
import Context from "../context";
import decreaseQuantity from "../helper/decreaseQuantity";
import { guestBumpQty, guestRemove } from "../helper/guestCart";
import increaseQuantity from "../helper/increaseQuantity";
import removeFromCart from "../helper/removeFromCart";

const CartItem = ({
  product,
  onQuantityChange,
  onItemRemove,
  isSelected,
  toggleSelect,
  latestProducts,
}) => {
  const { fetchUserAddToCart } = useContext(Context);
  const productData = product?.productId;
  const lockRef = useRef(false); // 🔒 Prevent rapid tap
  const navigation = useNavigation();

  // 🧠 Get stock for this product variant + size
  const getLiveStock = () => {
    const latestProduct = latestProducts.find(
      (p) => p._id === product.productId?._id || p._id === product.productId,
    );
    if (!latestProduct) return 0;

    const cartImageKey = canon(product.image);
    const variant = latestProduct.variants.find((v) =>
      (v.images || []).some((img) => canon(img) === cartImageKey),
    );
    if (!variant) return 0;

    const sizeKey = (product.size || "").trim().toLowerCase();
    const sizeObj = variant.sizes.find(
      (s) => (s.size || "").trim().toLowerCase() === sizeKey,
    );

    return sizeObj?.stock || 0;
  };

  // ✅ tiny builder to match guest item identity (size/color may be absent)
  const guestKey = {
    productId:
      product?.productId?._id || product?.productId || product?._id || "",
    image: product?.image || "",
    size: product?.size || "",
    color: product?.color || "",
  };

  const handleIncrease = async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      const liveStock = getLiveStock();
      const currentQty = Number(product?.quantity ?? 1);

      if (currentQty >= liveStock) {
        Toast.show({ type: "info", text1: "Stock limit reached" });
        return;
      }

      if (product?.isStoreData) {
        // 👤 Guest → AsyncStorage
        const r = await guestBumpQty(guestKey, +1);
        if (!r.ok) {
          Toast.show({ type: "error", text1: "Item not found in cart" });
          return;
        }
        onQuantityChange?.(product._id, r.qty);
        Toast.show({ type: "success", text1: "quantity +1" });
        return;
      } else {
        const res = await increaseQuantity(product._id);
        if (res.success) {
          onQuantityChange?.(product._id, currentQty + 1);
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update quantity" });
    } finally {
      lockRef.current = false;
    }
  };

  const handleDecrease = async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      const currentQty = Number(product?.quantity ?? 1);

      if (product?.isStoreData) {
        // 👤 Guest
        if (currentQty > 1) {
          const r = await guestBumpQty(guestKey, -1); // 0 or less → remove
          onQuantityChange?.(product._id, r.qty);
          if (r.qty === 0) {
            Toast.show({ type: "success", text1: "Item removed" });
          } else {
            Toast.show({ type: "success", text1: "quantity −1" });
          }
          return;
        }
      } else {
        // 🔐 Logged-in
        const res = await decreaseQuantity(product._id);
        if (res?.success) {
          onQuantityChange?.(product._id, Math.max(1, currentQty - 1));
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update quantity" });
    } finally {
      lockRef.current = false;
    }
  };

  const handleRemove = async () => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel" },
      {
        text: "Remove",
        onPress: async () => {
          try {
            if (product?.isStoreData) {
              // 👤 Guest
              await guestRemove(guestKey);
              onItemRemove?.(product._id);
              fetchUserAddToCart(false);
              Toast.show({ type: "success", text1: "Removed from cart" });
              return;
            } else {
              // 🔐 Logged-in
              const res = await removeFromCart(product._id);
              if (res?.success) {
                onItemRemove?.(product._id);
                fetchUserAddToCart(true);
              }
            }
          } catch (e) {
            Toast.show({ type: "error", text1: "Failed to remove item" });
          }
        },
      },
    ]);
  };

  const liveStock = getLiveStock();
  const variantImage = product?.image;
  const currentQty = Number(product?.quantity ?? 1);
  const sellingPrice = product?.selling * currentQty;

  let colorSize = "";
  if (product?.color && product?.size) {
    colorSize = `Color: ${product.color}/ Size: ${product.size}`;
  } else if (product?.color) {
    colorSize = `Color: ${product.color}`;
  } else if (product?.size) {
    colorSize = `Size: ${product.size}`;
  }

  const imageUrl = ensureHttps(variantImage);

  // when click on image (go - productDetails page)
  const handlePress = () => {
    let productId =
      product?.productId?._id || product?.productId || product?._id;
    const navigateMethod = navigation.navigate;
    navigateMethod("ProductDetails", {
      id: productId,
      variantColor: product.color || null,
      variantSize: product.size || null,
      image: imageUrl,
    });
  };

  return (
    <View style={[styles.card, liveStock === 0 && styles.outOfStockFade]}>
      <TouchableOpacity
        style={[styles.checkbox, isSelected ? styles.checked : null]}
        onPress={toggleSelect}
        disabled={liveStock === 0}
      >
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress}>
        <Image
          source={{ uri: variantImage.replace("http://", "https://") }}
          style={styles.image}
          contentFit="cover"
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {product.productName || productData?.productName}
          </Text>
          <TouchableOpacity onPress={handleRemove}>
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.variant}>{colorSize}</Text>

        <View style={styles.row}>
          <View style={styles.row}>
            <Text style={styles.currentPrice}>৳{sellingPrice}</Text>
            <Text style={styles.oldPrice}>৳{product?.price}</Text>
          </View>

          <View style={styles.quantityBox}>
            <TouchableOpacity onPress={handleDecrease} style={styles.qtyBtn}>
              <Text style={styles.qtyText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{currentQty}</Text>
            <TouchableOpacity
              onPress={handleIncrease}
              style={styles.qtyBtn}
              disabled={currentQty >= liveStock}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={liveStock === 0 ? styles.outStock : styles.inStock}>
          {liveStock === 0 ? "Sold out" : `Only ${liveStock} left`}
        </Text>
      </View>
    </View>
  );
};

const areCartItemPropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.product === nextProps.product &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.latestProducts === nextProps.latestProducts
  );
};

export default memo(CartItem, areCartItemPropsEqual);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 4,
    borderRadius: 10,
    alignItems: "center", // ✅ FIX HERE
    gap: 5,
    elevation: 1,
    marginHorizontal: 0,
    paddingHorizontal: 2,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f44336",
    alignItems: "center", // ✅ center horizontal
    justifyContent: "center", // ✅ center vertical
    backgroundColor: "#fff",
    //   marginRight: 0,
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 14,
    flex: 1,
    paddingRight: 5,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  removeBtn: {
    fontSize: 20,
    color: "#888",
    paddingRight: 5,
  },
  variant: {
    fontSize: 14,
    color: "#555",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  currentPrice: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#e53935",
  },
  oldPrice: {
    fontSize: 10,
    color: "#aaa",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  quantityBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyValue: {
    paddingHorizontal: 10,
    fontSize: 16,
  },
  inStock: {
    color: "green",
    fontSize: 13,
  },
  outStock: {
    color: "red",
    fontSize: 13,
    fontWeight: "bold",
  },
  outOfStockFade: {
    opacity: 0.4,
  },
});
