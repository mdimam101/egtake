import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔁 Randomize array
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const sortProductsByUserInterest = async (products = []) => {
  try {
    const data = await AsyncStorage.getItem("userInterest");
    const interest = data ? JSON.parse(data) : {};

    const interestProducts = [];

    for (const [subCat, viewCount] of Object.entries(interest)) {
      const matching = products.filter(
        (item) =>
          item.subCategory?.toLowerCase() === subCat.toLowerCase()
      );

      const shuffled = shuffleArray(matching); // 🔀 randomize list
      const max = Math.min(viewCount, 6); // cap 6
      interestProducts.push(...shuffled.slice(0, max));
    }

    const shownIds = new Set(interestProducts.map((p) => p._id));
    const fallback = products.filter((p) => !shownIds.has(p._id));

    return [...interestProducts, ...fallback];
  } catch (err) {
    // console.log("❌ Interest sort failed:", err);
    return products;
  }
};