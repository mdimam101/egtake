import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
// import { toHttp } from '../common/urlUtils';

const updateProductStock = async (productId, variantImage, size, quantity) => {
  // const imgConvertTohttp = toHttp(variantImage) 
  try {
    const res = await axios.put(
      SummaryApi.updateProductStock.url,
      {
        productId,
        variantImage,
        size,
        quantity, // quantity to reduce
      },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return res.data;
  } catch (err) {
    console.error('Stock update failed:', err);
    return { success: false };
  }
};

export default updateProductStock;
