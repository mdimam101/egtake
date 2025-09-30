// // utils/fsImageCache.js
// import * as FileSystem from "expo-file-system";
// import * as Crypto from "expo-crypto";

// const DIR = FileSystem.cacheDirectory + "img/";
// let ready;
// async function ensureDir() {
//   if (!ready) {
//     ready = FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
//   }
//   return ready;
// }

// export async function fileFor(url) {
//   await ensureDir();
//   const name = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url);
//   const path = `${DIR}${name}`;
//   const info = await FileSystem.getInfoAsync(path);
//   if (info.exists) return path;
//   await FileSystem.downloadAsync(url, path);
//   return path;
// }

// // প্রথম Nটা URL লোকালি ডাউনলোড করে file:// path ফিরিয়ে দেয়
// export async function warmLocalFirstN(urls = [], n = 6) {
//   const out = [];
//   for (let i = 0; i < Math.min(n, urls.length); i++) {
//     const u = urls[i];
//     if (!u) { out.push(null); continue; }
//     try {
//       out.push(await fileFor(u));
//     } catch {
//       out.push(null);
//     }
//   }
//   return out;
// }
