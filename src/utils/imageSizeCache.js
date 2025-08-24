// utils/imageSizeCache.js
import { Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Stores aspect ratios keyed by a canonical image URL
 * Value shape: { [key: string]: { r: number, t: number } }
 *  r = aspect ratio (h / w)
 *  t = timestamp (ms)
 */

const STORE_KEY = "imgHeights_v3";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_ENTRIES = 2000;               // soft cap to prevent bloat

// --- URL normalizers (protocol/query/hash insensitive) ---
const ensureHttpsLocal = (u = "") => String(u).replace(/^http:\/\//i, "https://");
const normalizeKey = (u = "") =>
  ensureHttpsLocal(u)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .split("?")[0]
    .split("#")[0]; // strip query/hash

let inFlight = new Map(); // key -> Promise

async function loadMap() {
  try {
    const raw = (await AsyncStorage.getItem(STORE_KEY)) || "{}";
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}

async function saveMap(map) {
  try {
    // prune if too big
    const keys = Object.keys(map);
    if (keys.length > MAX_ENTRIES) {
      // drop oldest ~10%
      keys
        .sort((a, b) => (map[a].t || 0) - (map[b].t || 0))
        .slice(0, Math.ceil(keys.length * 0.1))
        .forEach((k) => delete map[k]);
    }
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {}
}

async function fetchRatio(url) {
  return new Promise((resolve) => {
    Image.getSize(
      url,
      (w, h) => resolve(h && w ? h / w : null),
      () => resolve(null)
    );
  });
}

/**
 * Return cached ratio if fresh; otherwise null (no network).
 */
export async function getCachedRatio(url) {
  const key = normalizeKey(url);
  const map = await loadMap();
  const rec = map[key];
  if (!rec) return null;
  if (Date.now() - (rec.t || 0) > TTL_MS) return null; // expired
  return typeof rec.r === "number" ? rec.r : null;
}

/**
 * Get ratio with revalidation:
 * - If fresh cache exists, return immediately
 * - Else fetch from server, store, and return
 */
export async function getOrFetchRatio(url) {
  const full = ensureHttpsLocal(url);
  const key = normalizeKey(full);
  const map = await loadMap();
  const rec = map[key];

  if (rec && Date.now() - (rec.t || 0) <= TTL_MS && typeof rec.r === "number") {
    return rec.r; // fresh
  }

  // de-duplicate concurrent calls
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      (async () => {
        const r = await fetchRatio(full);
        const ratio = typeof r === "number" && isFinite(r) ? r : null;
        if (ratio) {
          map[key] = { r: ratio, t: Date.now() };
          await saveMap(map);
        }
        inFlight.delete(key);
        return ratio;
      })()
    );
  }
  return await inFlight.get(key);
}

/**
 * Warm up cache for a list of URLs (limited concurrency).
 * Returns count of successfully cached ratios.
 */
export async function warm(urls = [], { concurrency = 6 } = {}) {
  const uniq = Array.from(new Set(urls.filter(Boolean))).map(ensureHttpsLocal);
  let i = 0;
  let ok = 0;

  async function worker() {
    while (i < uniq.length) {
      const url = uniq[i++];
      const key = normalizeKey(url);
      // Skip if fresh
      const map = await loadMap();
      const rec = map[key];
      if (rec && Date.now() - (rec.t || 0) <= TTL_MS) continue;
      const r = await getOrFetchRatio(url);
      if (typeof r === "number") ok++;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return ok;
}

/**
 * Force refresh specific URL (ignores TTL).
 */
export async function forceRefresh(url) {
  const full = ensureHttpsLocal(url);
  const map = await loadMap();
  const r = await fetchRatio(full);
  if (typeof r === "number" && isFinite(r)) {
    const key = normalizeKey(full);
    map[key] = { r, t: Date.now() };
    await saveMap(map);
    return r;
  }
  return null;
}

/**
 * Optional helpers
 */
export async function clearAll() {
  await AsyncStorage.removeItem(STORE_KEY);
}
export async function stats() {
  const map = await loadMap();
  return { count: Object.keys(map).length, ttlDays: TTL_MS / 86400000 };
}
