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
      console.log("✅ setUserDetails Payload:", action.payload);
    },
  },
});

// Action export
export const { setUserDetails } = userSlice.actions;

// Reducer export
export default userSlice.reducer;