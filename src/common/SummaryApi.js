const BASE_URL ="https://api.egtake.com" // "https://e4imbebbpb.execute-api.ap-southeast-1.amazonaws.com"//"https://api.egtake.com" // 'https://e4imbebbpb.execute-api.ap-southeast-1.amazonaws.com' //"https://ecommerce-project-swart-five.vercel.app" //"http://192.168.3.4:8080"// "http://192.168.3.4:8080"// "https://ecommerce-project-mbcd.vercel.app"//
;

const SummaryApi = {
  signUp: {
    url: `${BASE_URL}/api/signup`,
    method: "post",
  },
  signIn: {
    url: `${BASE_URL}/api/signin`,
    method: "post",
  },
  current_user: {
    url: `${BASE_URL}/api/user-details`,
    method: "get",
  },
  logout_user: {
    url: `${BASE_URL}/api/userLogout`,
    method: "get",
  },
  all_users: {
    url: `${BASE_URL}/api/all-users`,
    method: "get",
  },
  get_product: {
    url: `${BASE_URL}/api/get-product`,
    method: "get",
  },
  category_product: {
    url: `${BASE_URL}/api/get-categoryProduct`,
    method: "get",
  },
  category_wish_product: {
    url: `${BASE_URL}/api/category-wish-product`,
    method: "post",
  },
  product_details: {
    url: `${BASE_URL}/api/product-details`,
    method: "post",
  },
  addToCartProduct: {
    url: `${BASE_URL}/api/addtocart`,
    method: "post",
  },
  count_AddToCart_Product: {
    url: `${BASE_URL}/api/countAddToCartProduct`,
    method: "get",
  },
  getCartProduct: {
    url: `${BASE_URL}/api/get-cart-products`,
    method: "get"
  },
  increaseQuantity: {
    url: `${BASE_URL}/api/increase-quantity`,
    method: "post",
  },
  decreaseQuantityProduct: {
    url: `${BASE_URL}/api/decrease-quantity`,
    method: "post",
  },
  removeFromCart: {
    url: `${BASE_URL}/api/remove`, 
    method: 'DELETE',
  },
  searchProduct: {
    url: `${BASE_URL}/api/search`,
    method: "get",
  },
  searchSuggestion: {
    url: `${BASE_URL}/api/search-suggestions`,
    method: "get"
  },
  get_banner: {
    url: `${BASE_URL}/api/banner`,
   method: "get",
  },
  upload_banner: {
    url: `${BASE_URL}/api/upload-banner`,
   method: "post",
  },
  delete_banner: {
    url: `${BASE_URL}/api/delete-banner`,
   method: "DELETE",
  },
  orders: {
    url: `${BASE_URL}/api/orders`,
   method: "post",
  },
  // ✅ New endpoint for saving/updating user default shipping
  update_shipping: {
    url: `${BASE_URL}/api/user/shipping`,
    method: "put",
  },
  get_all_orders: {
    url: `${BASE_URL}/api/all-orders`,
    method: "get",
  },
  get_user_orders: {
    url: `${BASE_URL}/api/user-all-ordrs`,
    method: "get",
  },
  cancel_user_order: {
    url: `${BASE_URL}/api/cancel`,
    method: "DELETE"
  },
  return_user_order: {
    url: `${BASE_URL}/api/return`, // PUT `/return/:orderId`
    method: "put",
  },
  return_user_order_item: {
  url: `${BASE_URL}/api/return`, // reuse same base
  method: "put"
},
// when order placeConfirm
updateProductStock: {
  url: `${BASE_URL}/api/reduce-stock`,
  method: "put"
},
create_review: {
    url: `${BASE_URL}/api/reviews`,
    method: "post",
  },
  get_product_reviews: (productId) => `${BASE_URL}/api/reviews/${productId}`,

  coupon_apply: { 
    url: `${BASE_URL}/api/coupons/apply`, 
    method: "POST" 
  },

  coupon_commit: {
  url: `${BASE_URL}/api/coupons/commit`,
  method: "post",
},

   google_login: {
    url: `${BASE_URL}/auth/google`,
    method: "post",
  },

    // 🔐 Phone OTP
  auth_request_otp: {
    url: `${BASE_URL}/api/auth/request-otp`,
    method: "post",
  },
  auth_verify_otp: {
    url: `${BASE_URL}/api/auth/verify-otp`,
    method: "post",
  },


    // --- BASIC TRACK ---
  track_basic: {
    url: `${BASE_URL}/api/track-basic`,
    method: "post",
  },

  // --- BASIC ANALYTICS (for your admin dashboards) ---
  analytics_basic_summary: {
    url: `${BASE_URL}/api/analytics-basic/summary`,
    method: "get",
  },
  analytics_basic_subcategory: {
    url: `${BASE_URL}/api/analytics-basic/subcategory`,
    method: "get",
  },
  analytics_basic_search_top: {
    url: `${BASE_URL}/api/analytics-basic/search-top`,
    method: "get",
  },
  analytics_basic_timeseries: {
    url: `${BASE_URL}/api/analytics-basic/timeseries`,
    method: "get",
  },
  delete_account: {
  url: `${BASE_URL}/api/account`,
  method: "delete",
},
};

export default SummaryApi;
