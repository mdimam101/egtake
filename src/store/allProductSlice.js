import { createSlice } from "@reduxjs/toolkit";
import { mergeProductCards } from "../helper/productCards";

const initialState = {
  productList: [],
};

const allProductSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setAllProductList: (state, action) => {
      state.productList = mergeProductCards([], action.payload || []);
    },
    appendAllProductList: (state, action) => {
      state.productList = mergeProductCards(
        state.productList,
        action.payload || [],
      );
    },
  },
});

export const { setAllProductList, appendAllProductList } =
  allProductSlice.actions;
export default allProductSlice.reducer;
