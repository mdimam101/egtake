import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_RECENT = "ui_recent_interest_v1"; // { [cat]: {count, ts} } or number (old)
const norm = (s) => (s || "").toString().trim().toLowerCase();

/** prefer createdTs, then createdAt; used only for top recent cats block */
const pickTime = (p) =>
  p?.createdTs != null
    ? Number(p.createdTs)
    : p?.createdAt != null
    ? new Date(p.createdAt).getTime()
    : 0;

const sortNewestFirst = (list) => {
  const hasTs = list.some((p) => p?.createdTs || p?.createdAt);
  if (!hasTs) return list;
  return [...list].sort((a, b) => pickTime(b) - pickTime(a));
};

function pushCategoryAll({ products, category, shown, out }) {
  const cat = norm(category);
  const pool = products.filter(
    (p) => norm(p?.category) === cat && !shown.has(p?._id)
  );
  const ordered = sortNewestFirst(pool); // only inside the chosen recent categories
  for (const p of ordered) {
    shown.add(p?._id);
    out.push(p);
  }
}

// ---------- Writer: RECENT only ----------
export async function increaseUserRecentInterest(categoryRaw, tsOpt) {
  const cat = norm(categoryRaw);
  if (!cat) return;
  const ts = Number(tsOpt || Date.now());
  try {
    const raw = await AsyncStorage.getItem(KEY_RECENT);
    const recent = raw ? JSON.parse(raw) : {};
    const prev = recent[cat];
    if (typeof prev === "number") {
      recent[cat] = { count: prev + 1, ts };
    } else if (prev && typeof prev === "object") {
      recent[cat] = { count: (prev.count || 0) + 1, ts };
    } else {
      recent[cat] = { count: 1, ts };
    }
    await AsyncStorage.setItem(KEY_RECENT, JSON.stringify(recent));
  } catch {}
}

// ---------- Reader/Sorter: take topK recent cats by ts; rest = API order ----------
function normalizeRecent(rawObj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(rawObj)) {
    const key = norm(k);
    if (typeof v === "number") {
      out[key] = { count: Number(v) || 0, ts: 0 };
    } else if (v && typeof v === "object") {
      out[key] = {
        count: Number(v.count || 0) || 0,
        ts: Number(v.ts || 0) || 0,
      };
    }
  }
  return out;
}

/**
 * topK: কতটি recent ক্যাটাগরি ওপরে তুলবে (default 2)
 * threshold: recent হিসেবে ধরতে ন্যূনতম view (default 2) — চাইলে 1 করো।
 * অর্ডার: [topK recent cats (ts desc, no cap)] + [rest in original API order]
 */
export async function sortProductsByUserInterest(
  products = [],
  { topK = 2, threshold = 2 } = {}
) {
  try {
    const raw = await AsyncStorage.getItem(KEY_RECENT);
    const recentMap = normalizeRecent(raw ? JSON.parse(raw) : {});

    // pick recent cats by ts desc (filter by threshold)
    const recentCats = Object.entries(recentMap)
      .filter(([, m]) => (m?.count || 0) >= threshold)
      .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0))
      .slice(0, topK)
      .map(([cat]) => cat);

    const out = [];
    const shown = new Set();

    // 1) push only topK recent cats
    for (const cat of recentCats) {
      pushCategoryAll({ products, category: cat, shown, out });
    }

    // 2) rest: exactly as API order (no extra grouping/sorting)
    for (const p of products) {
      if (!shown.has(p?._id)) out.push(p);
    }

    return out;
  } catch {
    return products;
  }
}

// Debug (optional)
export async function getRecentDebug() {
  const r = await AsyncStorage.getItem(KEY_RECENT);
  // await AsyncStorage.removeItem(KEY_RECENT);
  const recent = r ? JSON.parse(r) : {};
  // console.log("RECENT:", recent);
  return recent;
}
