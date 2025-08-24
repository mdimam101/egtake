import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../store/userSlice'; // 🔁 adjust path if needed
import categoryReducer from '../store/categorySlice'; 
import productReducer from '../store/allProductSlice'
import banarReducer from '../store/banarSlice'
import trendingReducer from '../store/trendingSlice'; 
import under99Reducer from '../store/under99Slice';

const store = configureStore({
  reducer: {
    userState: userReducer,
    categoryState: categoryReducer, // 🆕 category add
    productState:productReducer,
    banarState: banarReducer,
     trendingState: trendingReducer,
     under99State: under99Reducer,
  },
});

export default store;