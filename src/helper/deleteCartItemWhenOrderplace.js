import axios from "axios";
import SummaryApi from "../common/SummaryApi";

const deleteCartItemWhenOrderplace = async (cartItemIds) => {
  try {
    const res = await axios({
      method: SummaryApi.removeFromCart.method,
      url: SummaryApi.removeFromCart.url,
      data: { cartItemIds },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    // console.error("Delete cart item error:", err);
    return { success: false };
  }
};

export default deleteCartItemWhenOrderplace;
