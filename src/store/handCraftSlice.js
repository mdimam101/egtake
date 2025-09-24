import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  handCraftList: [],   // only hand-craft products (optimized items)
  lastUpdatedAt: null,
};

const handCraftSlice = createSlice({
  name: "handCraft",
  initialState,
  reducers: {
    setHandCraftList: (state, action) => {
      state.handCraftList = action.payload || [];
      state.lastUpdatedAt = Date.now();
    },
    prependHandCraft: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set();
      const merged = [...incoming, ...state.handCraftList].filter((p) => {
        if (!p?._id) return false;
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      state.handCraftList = merged;
      state.lastUpdatedAt = Date.now();
    },
    clearHandCraft: (state) => {
      state.handCraftList = [];
      state.lastUpdatedAt = null;
    },
  },
});

export const { setHandCraftList, prependHandCraft, clearHandCraft } = handCraftSlice.actions;
export default handCraftSlice.reducer;
