import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const CheckoutItemCard = ({ item }) => {
   const { productId, Quantity, color, size, image } = item;
  const price = productId?.selling  || 0;//|| productId?.price
  const total = price * Quantity;

  return (
    <View style={styles.card}>
       <Image source={{ uri: image.replace("http://", "https://") }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.price}>৳{total}</Text>
        <Text style={styles.qty}>Qty: {Quantity}</Text>
      </View>
    </View>
  );
};

export default CheckoutItemCard;

const styles = StyleSheet.create({
  card: {
    width: 100,
    marginRight: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)', // soft border
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    alignItems: 'center',
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 6,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  details: {
    alignItems: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e53935', // red tone
  },
  qty: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
});
