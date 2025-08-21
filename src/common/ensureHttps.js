// src/common/ensureHttps.js
export default function ensureHttps(url) {
  if (!url) return url;
  try {
    return url.startsWith("http://") ? url.replace("http://", "https://") : url;
  } catch {
    return url;
  }
}
