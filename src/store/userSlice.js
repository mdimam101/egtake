import { createSlice } from "@reduxjs/toolkit";

/*👉 Redux store এর initial value set করা হয়েছে। */
const initialState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload;
      // console.log("✅ setUserDetails Payload:", action.payload);
    },
    recordOrderPlaced: (state, action) => {
      if (!state.user || state.user._id !== action.payload.userId) return;
      const balance = Number(state.user.point);
      const usedPoint = action.payload.usedPoint;
      if (
        Number.isFinite(balance) &&
        Number.isSafeInteger(usedPoint) &&
        usedPoint >= 0
      ) {
        state.user.point = Math.max(0, balance - usedPoint);
      }
      state.user.hasPlacedFirstOrder = true;
    },
  },
});

// Action export
export const { setUserDetails, recordOrderPlaced } = userSlice.actions;

// Reducer export
export default userSlice.reducer;
