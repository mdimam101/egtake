// store/under99Slice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  under99List: [],
  lastUpdatedAt: null,
};

const under99Slice = createSlice({
  name: "under99",
  initialState,
  reducers: {
    setUnder99List: (state, action) => {
      state.under99List = action.payload || [];
      state.lastUpdatedAt = Date.now();
    },
    clearUnder99: (state) => {
      state.under99List = [];
      state.lastUpdatedAt = null;
    },
  },
});

export const { setUnder99List, clearUnder99 } = under99Slice.actions;
export default under99Slice.reducer;
