// utils/getCreatedAt.js
// export default function getCreatedAt(p = {}) {
//   if (p.createdAt) return new Date(p.createdAt);
//   // derive from Mongo ObjectId
//   if (p._id && typeof p._id === "string" && p._id.length >= 8) {
//     const ts = parseInt(p._id.substring(0, 8), 16);
//     return new Date(ts * 1000);
//   }
//   return new Date(0);
// }