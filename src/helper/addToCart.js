import axios from 'axios';
import { Alert, Platform, ToastAndroid } from 'react-native';
import SummaryApi from '../common/SummaryApi';

const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Notification', message);
  }
};

const addToCart = async ({ productId, size, color, image, price, selling }) => {
  
  try {
    const response = await axios({
      method: SummaryApi.addToCartProduct.method,
      url: SummaryApi.addToCartProduct.url,
      headers: {
        'Content-Type': 'application/json',
      },
      //withCredentials: true, // Send cookies for auth
      data: { productId, size, color, image, price, selling },
    });

    const result = response.data;

    if (result.success) {
      showToast(result.message);
    } else if (result.error) {
      showToast(result.message);
    }
  } catch (error) {
    // console.error('Error adding to cart:', error);
    // showToast('Something went wrong!');
  }
};

export default addToCart;