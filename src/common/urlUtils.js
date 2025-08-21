export function ensureHttps(url) {
  if (typeof url !== "string" || !url) return url;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

export function canon(url) {
  if (typeof url !== "string" || !url) return "";
  return url.trim().replace(/^https?:\/\//i, "").replace(/%20/gi, " ").replace(/\s+/g, " ");
}

// ✅ API payload-এ পাঠানোর সময় http নিশ্চিত করতে
export function toHttp(url) {
  if (typeof url !== "string" || !url) return url;
  return url.startsWith("https://") ? url.replace("https://", "http://") : url;
}


// সার্ভারে পাঠানোর জন্য: যে ইমেজটা variant list-এ আছে,
// সেটার original string (http/https যেটা ছিল) রিটার্ন করো।
export const toServerUrl = (selectedImg = "", variants = []) => {
  const sel = canon(selectedImg);
  for (const v of variants || []) {
    for (const img of v?.images || []) {
      if (canon(img) === sel) return img; // original রাখো
    }
  }
  return selectedImg; // fallback
};
