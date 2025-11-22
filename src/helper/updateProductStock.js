import axios from 'axios';
import SummaryApi from '../common/SummaryApi';

const updateProductStock = async (productId, variantImage, size, quantity, isCancelOrder = false) => {

  try {
    const res = await axios.put(
      SummaryApi.updateProductStock.url,
      {
        productId,
        variantImage,
        size,
        quantity, // quantity +-
        isCancelOrder, //true/false 
      },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return res.data;
  } catch {
    //  console.error('Stock update failed:');
    return { success: false };
  }
};

export default updateProductStock;
