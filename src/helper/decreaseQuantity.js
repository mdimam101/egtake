import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
import { ToastAndroid } from 'react-native';

const decreaseQuantity = async (cartItemId) => {
  try {
    const response = await axios({
      method: SummaryApi.decreaseQuantityProduct.method,
      url: SummaryApi.decreaseQuantityProduct.url,
      data: { cartItemId },
      withCredentials: true,
    });

    const result = response.data;

    if (result.success) {
      ToastAndroid.show(result.message || "Quantity decreased", ToastAndroid.SHORT);
    } else {
      ToastAndroid.show(result.message || "Failed to decrease quantity", ToastAndroid.SHORT);
    }

    return result;
  } catch (err) {
    // console.error('Decrease quantity error:', err);
    // ToastAndroid.show("Error decreasing quantity", ToastAndroid.SHORT);
    return { success: false };
  }
};

export default decreaseQuantity;
