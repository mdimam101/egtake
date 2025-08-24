import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
import { ToastAndroid } from 'react-native';

const increaseQuantity = async (cartItemId) => {
  try {
    const response = await axios({
      method: SummaryApi.increaseQuantity.method,
      url: SummaryApi.increaseQuantity.url,
      data: { cartItemId },
      withCredentials: true,
    });

    const result = response.data;

    if (result.success) {
      // ToastAndroid.show(result.message || "Quantity increased", ToastAndroid.SHORT);
    } else {
      // ToastAndroid.show(result.message || "Failed to increase quantity", ToastAndroid.SHORT);
    }

    return result;
  } catch (err) {
    return { success: false };
  }
};

export default increaseQuantity;
