// utils/imageSizeCache.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";

/**
 * Persistent, write-once image ratio cache:
 * Map shape: { [key: string]: { r: number, t: number } }
 * r = aspect ratio (h / w)
 * t = last write time (only for pruning; no TTL)
 */

const STORE_KEY = "imgHeights_v4";
const MAX_ENTRIES = 2000; // soft cap

// --- URL normalizers (protocol/query/hash insensitive) ---
const ensureHttpsLocal = (u = "") => String(u).replace(/^http:\/\//i, "https://");
const normalizeKey = (u = "") =>
  ensureHttpsLocal(u)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .split("?")[0]
    .split("#")[0];

let mem = null;            // in-memory cache map
let loadPromise = null;    // singleton loader
const inFlight = new Map(); // key -> Promise
let saveTimer = null;

async function ensureLoaded() {
  if (mem) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        mem = parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        mem = {};
      }
    })();
  }
  await loadPromise;
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    try {
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(mem));
    } catch {}
    saveTimer = null;
  }, 200); // debounce
}

function pruneIfNeeded() {
  const keys = Object.keys(mem);
  if (keys.length <= MAX_ENTRIES) return;
  // drop oldest ~10%
  keys
    .sort((a, b) => (mem[a].t || 0) - (mem[b].t || 0))
    .slice(0, Math.ceil(keys.length * 0.1))
    .forEach((k) => delete mem[k]);
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
 * Return cached ratio if exists; otherwise null.
 * No TTL. No background refresh.
 */
export async function getCachedRatio(url) {
  if (!url) return null;
  await ensureLoaded();
  const key = normalizeKey(url);
  const rec = mem[key];
  return rec && typeof rec.r === "number" ? rec.r : null;
}

/**
 * Return ratio; fetch-and-store only if missing.
 * No revalidation for existing entries.
 */
export async function getOrFetchRatio(url) {
  if (!url) return null;
  await ensureLoaded();
  const full = ensureHttpsLocal(url);
  const key = normalizeKey(full);

  const existing = mem[key];
  if (existing && typeof existing.r === "number") {
    return existing.r; // already cached
  }

  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      (async () => {
        const r = await fetchRatio(full);
        const ratio = typeof r === "number" && isFinite(r) ? r : null;
        if (ratio != null) {
          mem[key] = { r: ratio, t: Date.now() };
          pruneIfNeeded();
          scheduleSave();
        }
        inFlight.delete(key);
        return ratio;
      })()
    );
  }
  return await inFlight.get(key);
}

/**
 * Warm cache for a list of URLs (only misses are fetched).
 */
export async function warm(urls = [], { concurrency = 6 } = {}) {
  await ensureLoaded();
  const uniq = Array.from(new Set(urls.filter(Boolean))).map(ensureHttpsLocal);
  let i = 0;
  let ok = 0;

  async function worker() {
    while (i < uniq.length) {
      const url = uniq[i++];
      const key = normalizeKey(url);
      if (mem[key] && typeof mem[key].r === "number") continue; // skip hits
      const r = await getOrFetchRatio(url);
      if (typeof r === "number") ok++;
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, 8)) }, worker));
  return ok;
}

// Optional helpers
export async function clearAll() {
  mem = {};
  scheduleSave();
  await AsyncStorage.removeItem(STORE_KEY);
}
export async function stats() {
  await ensureLoaded();
  return { count: Object.keys(mem).length };
}
