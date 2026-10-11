import { generateOptimizedVariants } from "./variantUtils";

// Keep the existing interleaved variant cards, using the lightweight response.
export const normalizeProductCards = (products = []) => {
  if (!Array.isArray(products)) return [];

  return generateOptimizedVariants(products.filter((product) => product?._id));
};

const getCardKey = (card) =>
  card.cardKey || `${card._id}::${card.variantId || card.img || "noimg"}`;

// Offset pagination can overlap when new products are published between pages.
// Deduplicate cards rather than products so every variant remains available.
export const mergeProductCards = (current = [], incoming = []) => {
  const merged = [];
  const indexes = new Map();

  for (const card of [...current, ...incoming]) {
    if (!card?._id) continue;
    const key = getCardKey(card);
    if (indexes.has(key)) {
      merged[indexes.get(key)] = card;
    } else {
      indexes.set(key, merged.length);
      merged.push(card);
    }
  }

  return merged;
};
