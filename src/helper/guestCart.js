// cartStore/guestCart.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_CART_KEY = 'guestCart';

// ছোট helper: JSON parse safe
const parse = (raw) => {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
};

const norm = (v) => (v ?? '').toString().trim();
const normImg = (img) => (img ? img.replace('https://', 'http://') : '');

// cart item identity: productId + image + size + color
const sameItem = (a, b) =>
  (norm(a.productId) === norm(b.productId)) &&
  (norm(a.size) === norm(b.size)) &&
  (norm(a.color) === norm(b.color)) &&
  (normImg(a.image) === normImg(b.image));

/** synthetic _id, কারণ CartPage item._id ও item.productId._id ইউজ করে */
const makeGuestId = (it) => {
  const pid = norm(it.productId);
  const img = normImg(it.image);
  const sz  = norm(it.size);
  const col = norm(it.color);
  return `guest::${pid}::${img}::${sz}::${col}`;
};

/**
 * ✅ DUPLICATE ব্লক রেখে add করবো
 * কিন্তু সেভ করবো এমন শেপে যেন CartPage / CartItem আগের মতোই কাজ করে:
 * - _id (string)
 * - productId: { _id, productName, price, selling }
 * - root: image, size, color, quantity/quantity, price, selling
 */
export const pushGuestCartUnique = async (item) => {
  // normalize করলে compare stable হয়
  const normImage = (item.image || '').replace('https://', 'http://');
  const normSize  = (item.size  || '').trim();
  const normColor = (item.color || '').trim();

  const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
  const arr = parse(raw);

  const exists = arr.some(x =>
    x.productId && typeof x.productId === 'object'
      ? (
          // new-shape item
          x.productId._id === item.productId &&
          (x.size || '')  === normSize &&
          (x.color || '') === normColor &&
          (x.image || '') === normImage
        )
      : (
          // old-shape fallback
          x.productId === item.productId &&
          (x.size || '')  === normSize &&
          (x.color || '') === normColor &&
          (x.image || '') === normImage
        )
  );

  if (exists) {
    return { added: false, reason: 'duplicate' }; // ❌ already in cart
  }

  // CartPage expects server-like shape
  const price   = Number(item.price ?? 0);
  const selling = Number(item.selling ?? 0);

  const toSave = {
    _id: makeGuestId({ productId: item.productId, image: normImage, size: normSize, color: normColor }),

    // CartPage uses item.productId._id, .selling, .price
    productId: {
      _id: item.productId,
      productName: item.productName || '',
      price,
      selling,
    },

    image: normImage,
    size: normSize,
    color: normColor,

    // Qty fields (দুটো রাখছি)
    quantity: 1,

    // Root pricing (CartItem এ product?.selling * product.quantity)
    price,
    selling,

    addedAt: Date.now(),
    isStoreData : true // default set
  };

  arr.push(toSave);
  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(arr));
  return { added: true };
};


/** +1 / -1 quantity for a guest item (qty<=0 হলে remove). Returns updated array. */
export async function guestBumpQty(match, delta) {
  const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
  const arr = parse(raw);

  // normalize match fields
  const key = {
    productId: norm(match.productId),
    size: norm(match.size),
    color: norm(match.color),
    image: normImg(match.image),
  };

  // match both new-shape (productId is object) and old-shape
  const idx = arr.findIndex(x => {
    const pid = typeof x.productId === 'object' ? x.productId?._id : x.productId;
    return (
      norm(pid) === key.productId &&
      norm(x.size) === key.size &&
      norm(x.color) === key.color &&
      normImg(x.image) === key.image
    );
  });

  if (idx < 0) return { ok: false, reason: 'not_found', items: arr };

  const cur = Number( arr[idx].quantity ?? 1);
  const next = cur + Number(delta || 0);

  if (next <= 0) {
    arr.splice(idx, 1); // remove item
  } else {
    // keep BOTH fields for UI compatibility
    arr[idx].quantity = next;
  }

  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(arr));
  return { ok: true, items: arr, qty: next <= 0 ? 0 : next };
}

/** Remove a guest item outright. */
export async function guestRemove(match) {
  const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
  const arr = parse(raw);

  const key = {
    productId: norm(match.productId),
    size: norm(match.size),
    color: norm(match.color),
    image: normImg(match.image),
  };

  const filtered = arr.filter(x => {
    const pid = typeof x.productId === 'object' ? x.productId?._id : x.productId;
    return !(
      norm(pid) === key.productId &&
      norm(x.size) === key.size &&
      norm(x.color) === key.color &&
      normImg(x.image) === key.image
    );
  });

  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(filtered));
  return { ok: true, items: filtered };
}

export const cartDuplicateCheck = async (item) => {
  // normalize করলে compare stable হয়
  const normImage = (item.image || '').replace('https://', 'http://');
  const normSize  = (item.size  || '').trim();
  const normColor = (item.color || '').trim();

  const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
  const arr = parse(raw);

  const exists = arr.some(x =>
    x.productId && typeof x.productId === 'object'
      ? (
          // new-shape item
          x.productId._id === item.productId &&
          (x.size || '')  === normSize &&
          (x.color || '') === normColor &&
          (x.image || '') === normImage
        )
      : (
          // old-shape fallback
          x.productId === item.productId &&
          (x.size || '')  === normSize &&
          (x.color || '') === normColor &&
          (x.image || '') === normImage
        )
  );
  // console.log("exist....2", exists);
    return { existsAddToCart: exists }; // ❌ already in cart
}