// store/trendingSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  trendingList: [],   // only trending products (optimized items)
  lastUpdatedAt: null
};

const trendingSlice = createSlice({
  name: "trending",
  initialState,
  reducers: {
    setTrendingList: (state, action) => {
      state.trendingList = action.payload || [];
      state.lastUpdatedAt = Date.now();
    },
    prependTrending: (state, action) => {
      // accept array of products; remove dup by _id; keep newest-first order
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set();
      const merged = [...incoming, ...state.trendingList].filter(p => {
        if (!p?._id) return false;
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      state.trendingList = merged;
      state.lastUpdatedAt = Date.now();
    },
    clearTrending: (state) => {
      state.trendingList = [];
      state.lastUpdatedAt = null;
    }
  }
});

export const { setTrendingList, prependTrending, clearTrending } = trendingSlice.actions;
export default trendingSlice.reducer;
