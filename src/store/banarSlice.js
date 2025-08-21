import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  banarList: [],
};

const banarSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setBanarList: (state, action) => {
      state.banarList = action.payload;
    },
  },
});

export const { setBanarList } = banarSlice.actions;
export default banarSlice.reducer;