import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  commonInfoList: [],
};

const commonInfoSlice = createSlice({
  name: 'commonInfo',
  initialState,
  reducers: {
    setCommonGetInfoList: (state, action) => {
      state.commonInfoList = action.payload;
    },
  },
});

export const { setCommonGetInfoList } = commonInfoSlice.actions;
export default commonInfoSlice.reducer;