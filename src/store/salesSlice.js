// store/salesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  salesList: [],     // only sales products (optimized items)
  lastUpdatedAt: null,
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setSalesList: (state, action) => {
      state.salesList = Array.isArray(action.payload) ? action.payload : [];
      state.lastUpdatedAt = Date.now();
    },
    prependSales: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set();
      const merged = [...incoming, ...state.salesList].filter((p) => {
        if (!p?._id) return false;
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      state.salesList = merged;
      state.lastUpdatedAt = Date.now();
    },
    clearSales: (state) => {
      state.salesList = [];
      state.lastUpdatedAt = null;
    },
  },
});

export const { setSalesList, prependSales, clearSales } = salesSlice.actions;
export default salesSlice.reducer;
