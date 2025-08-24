// utils/optimizeImageUrl.js
import { PixelRatio } from "react-native";

export function optimizeImageUrl(url, targetCssWidthPx = 180) {
  if (!url) return url;
  try {
    const u = new URL(url.replace("http://", "https://"));
    // Cloudinary হলে /upload/ এর পরে transform বসাও
    if (u.hostname.includes("cloudinary")) {
      const dpr = Math.min(3, PixelRatio.get());
      const w = Math.max(80, Math.round(targetCssWidthPx * dpr));
      u.pathname = u.pathname.replace(
        /\/upload\/(?!.*\/upload\/)/,
        `/upload/f_auto,q_auto,w_${w},dpr_${dpr}/`
      );
      return u.toString();
    }
  } catch {}
  return url.replace("http://", "https://");
}
