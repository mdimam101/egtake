import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
import { ToastAndroid } from 'react-native';

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
  } catch (err) {
    // console.error('Remove from cart error:', err);
    // ToastAndroid.show("Error removing item", ToastAndroid.SHORT);
    return { success: false };
  }
};

export default removeFromCart;
