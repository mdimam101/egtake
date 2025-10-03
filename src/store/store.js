import { configureStore } from "@reduxjs/toolkit";
import productReducer from "../store/allProductSlice";
import banarReducer from "../store/banarSlice";
import categoryReducer from "../store/categorySlice";
import handCraftReducer from "../store/handCraftSlice";
import salesReducer from "../store/salesSlice";
import trendingReducer from "../store/trendingSlice";
import under99Reducer from "../store/under99Slice";
import userReducer from "../store/userSlice"; // 🔁 adjust path if needed
import commonReducer from "./commonInfoSlice";

const store = configureStore({
  reducer: {
    userState: userReducer,
    categoryState: categoryReducer, // 🆕 category add
    productState: productReducer,
    banarState: banarReducer,
    trendingState: trendingReducer,
    handCraftState: handCraftReducer,
    under99State: under99Reducer,
    salesState: salesReducer,
    commonState: commonReducer,
  },
});

export default store;
