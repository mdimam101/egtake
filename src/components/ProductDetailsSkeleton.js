// import React from "react";
// import SkeletonPlaceholder from "react-native-skeleton-placeholder";
// import { ScrollView, View } from "react-native"; // ✅ Correct import

// const ProductDetailsSkeleton = () => (
//   <ScrollView style={{ padding: 16 }}>
//     <View borderRadius={4}>
//       {/* 🖼️ Image slider placeholder */}
//       <View style={{ width: "100%", height: 500, borderRadius: 8 }} />

//       <View style={{ height: 20 }} />

//       {/* 💰 Price Row */}
//       <View style={{ flexDirection: "row", alignItems: "center" }}>
//         <View style={{ width: 80, height: 24, borderRadius: 4 }} />
//         <View style={{ width: 60, height: 20, borderRadius: 4, marginLeft: 8 }} />
//         <View style={{ width: 60, height: 20, borderRadius: 4, marginLeft: 8 }} />
//       </View>

//       <View style={{ height: 16 }} />

//       {/* 🧢 Product Name */}
//       <View style={{ width: "60%", height: 20, borderRadius: 4 }} />

//       <View style={{ height: 20 }} />

//       {/* 🛍️ Size boxes */}
//       <View style={{ flexDirection: "row", gap: 10 }}>
//         {[1, 2, 3, 4].map((_, i) => (
//           <View
//             key={i}
//             style={{
//               width: 50,
//               height: 32,
//               borderRadius: 6,
//               marginRight: 10,
//             }}
//           />
//         ))}
//       </View>

//       <View style={{ height: 24 }} />

//       {/* 📦 Commitment box */}
//       <View style={{ width: "100%", height: 120, borderRadius: 10 }} />

//       <View style={{ height: 24 }} />

//       {/* 🛒 Add to Cart Button */}
//       <View
//         style={{
//           width: "100%",
//           height: 48,
//           borderRadius: 25,
//         }}
//       />
//     </View>
//   </ScrollView>
// );

// export default ProductDetailsSkeleton;
