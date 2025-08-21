import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  productList: [],
};

const allProductSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setAllProductList: (state, action) => {
      state.productList = action.payload;
    },
  },
});

export const { setAllProductList } = allProductSlice.actions;
export default allProductSlice.reducer;