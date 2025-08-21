import AsyncStorage from "@react-native-async-storage/async-storage";

export const increaseUserInterest = async (subCategory) => {
  try {
    const data = await AsyncStorage.getItem("userInterest");
    let parsed = data ? JSON.parse(data) : {};
    parsed[subCategory] = (parsed[subCategory] || 0) + 1;
    await AsyncStorage.setItem("userInterest", JSON.stringify(parsed));
  } catch (err) {
    // console.error("Interest update failed", err);
  }
};