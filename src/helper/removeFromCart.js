import axios from 'axios';
import { ToastAndroid } from 'react-native';
import SummaryApi from '../common/SummaryApi';

const removeFromCart = async (cartItemId) => {
  try {
    const response = await axios({
      method: SummaryApi.removeFromCart.method,
      url: SummaryApi.removeFromCart.url,
      data: { cartItemId },
      withCredentials: true,
    });

    const result = response.data;

    if (result.success) {
      ToastAndroid.show(result.message || "Removed from cart", ToastAndroid.SHORT);
    } else {
      ToastAndroid.show(result.message || "Failed to remove item", ToastAndroid.SHORT);
    }

    return result;
  } catch {
    return { success: false };
  }
};

export default removeFromCart;
