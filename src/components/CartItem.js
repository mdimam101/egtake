import React, { useContext, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Context from '../context';
import increaseQuantity from '../helper/increaseQuantity';
import decreaseQuantity from '../helper/decreaseQuantity';
import removeFromCart from '../helper/removeFromCart';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get("window").width;

const CartItem = ({
  product,
  refreshCart,
  isSelected,
  toggleSelect,
  latestProducts,
}) => {
  const { fetchUserAddToCart } = useContext(Context);
  const productData = product?.productId;
  const lockRef = useRef(false); // 🔒 Prevent rapid tap

  // 🧠 Get stock for this product variant + size
  const getLiveStock = () => {
    const latestProduct = latestProducts.find(
      (p) => p._id === product.productId._id
    );
    if (!latestProduct) return 0;

    const variant = latestProduct.variants.find(
      (v) => v.images?.[0] === product.image
    );
    if (!variant) return 0;

    const sizeKey = (product.size || "").trim().toLowerCase();
    const sizeObj = variant.sizes.find(
      (s) => (s.size || "").trim().toLowerCase() === sizeKey
    );

    return sizeObj?.stock || 0;
  };

  const handleIncrease = async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    const liveStock = getLiveStock();
    if (product.Quantity >= liveStock) {
      Toast.show({ type: "info", text1: "Stock limit reached" });
      lockRef.current = false;
      return;
    }

    try {
      const res = await increaseQuantity(product._id);
      if (res.success) {
        await fetchUserAddToCart(true);
        refreshCart();
      }
    } catch (err) {
      // console.warn("Increase quantity error:", err?.response?.data?.message || err.message);
      // Toast.show({
      //   type: "error",
      //   text1: err?.response?.data?.message || "Could not increase quantity",
      // });
    } finally {
      lockRef.current = false;
    }
  };

  const handleDecrease = async () => {
    const res = await decreaseQuantity(product._id);
    if (res.success) {
      fetchUserAddToCart(true);
      refreshCart();
    }
  };

  const handleRemove = async () => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        onPress: async () => {
          const res = await removeFromCart(product._id);
          if (res.success) {
            fetchUserAddToCart(true);
            refreshCart();
          }
        },
      },
    ]);
  };

  const liveStock = getLiveStock();
  const variantImage = product?.image;
  const sellingPrice = product?.selling * product.Quantity || 0;

  let colorSize = "";
  if (product?.color && product?.size) {
    colorSize = `Color: ${product.color}/ Size: ${product.size}`;
  } else if (product?.color) {
    colorSize = `Color: ${product.color}`;
  } else if (product?.size) {
    colorSize = `Size: ${product.size}`;
  }

  return (
    <View style={[styles.card, liveStock === 0 && styles.outOfStockFade]}>
      <TouchableOpacity
        style={[styles.checkbox, isSelected ? styles.checked : null]}
        onPress={toggleSelect}
        disabled={liveStock === 0}
      >
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <Image
        source={{ uri: variantImage.replace("http://", "https://") }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {productData?.productName}
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
            <Text style={styles.qtyValue}>{product.Quantity}</Text>
            <TouchableOpacity
              onPress={handleIncrease}
              style={styles.qtyBtn}
              disabled={product.Quantity >= liveStock}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={liveStock === 0 ? styles.outStock : styles.inStock}>
          {liveStock === 0 ? 'Sold out' : `Only ${liveStock} left`}
        </Text>
      </View>
    </View>
  );
};

export default CartItem;

const styles = StyleSheet.create({
  card: {
  flexDirection: 'row',
  padding: 10,
  backgroundColor: '#fff',
  marginBottom: 4,
  borderRadius: 10,
  alignItems: 'center', // ✅ FIX HERE
  gap: 5,
  elevation: 1,
  marginHorizontal: 0,
  paddingHorizontal:2
},

checkbox: {
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#f44336',
  alignItems: 'center',      // ✅ center horizontal
  justifyContent: 'center',  // ✅ center vertical
  backgroundColor: '#fff',
//   marginRight: 0,
},

checked: {
  backgroundColor: '#f44336',
},

checkmark: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
  lineHeight: 18,
},
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
name: {
  fontWeight: 'bold',
  fontSize: 14,
  flex: 1,
  paddingRight: 5,
  numberOfLines: 1,
  ellipsizeMode: 'tail',
},
  removeBtn: {
    fontSize: 20,
    color: '#888',
    paddingRight:5
  },
  variant: {
    fontSize: 14,
    color: '#555',
  },
row: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
},
currentPrice: {
  fontWeight: 'bold',
  fontSize: 16,
  color: '#e53935',
},
oldPrice: {
  fontSize: 10,
  color: '#aaa',
  textDecorationLine: 'line-through',
  marginLeft: 6,
},
  quantityBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyValue: {
    paddingHorizontal: 10,
    fontSize: 16,
  },
  inStock: {
    color: 'green',
    fontSize: 13,
  },
  outStock: {
    color: 'red',
    fontSize: 13,
    fontWeight: 'bold',
  },
  outOfStockFade: {
  opacity: 0.4,
},
});
