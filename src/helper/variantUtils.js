// helpers/variantUtils.js
const getCreatedAt = (p = {}) => { 
  if (p.createdAt) return new Date(p.createdAt);
  if (p._id && typeof p._id === "string" && p._id.length >= 8) {
    const ts = parseInt(p._id.substring(0, 8), 16);
    return new Date(ts * 1000);
  }
  return new Date(0);
};

export const generateOptimizedVariants = (products = []) => {
  const grouped = Object.create(null);
  let maxLen = 0;

  for (let i = 0; i < products.length; i++) {
    const item = products[i] || {};
    const variants = Array.isArray(item.variants) ? item.variants : [];
    const baseCreatedTs = +getCreatedAt(item);

    // ✅ এখন সব variants দেখাবে
    if (variants.length === 0) {
      const v = {
        _id: item._id,
        productName: item.productName,
        selling: item.selling,
        category: item.category,
        subCategory: item.subCategory,
        img: item?.img || item?.images?.[0] || null,
        variantColor: null,
        variantSize: null,
        trandingProduct: !!item.trandingProduct,
        handCraft: !!item.handCraft,
        salesOn:!!item.salesOn,
        displaySalesSlied:!!item.displaySalesSlied,
        createdTs: baseCreatedTs,
        cardKey: `${item._id}::${(item?.img || item?.images?.[0] || "noimg")}`,
      };
      grouped[item._id] = [v];
      if (maxLen < 1) maxLen = 1;
      continue;
    }

    // ✅ সব নিন
    const take = variants.length;
    const bucket = new Array(take);
    for (let k = 0; k < take; k++) {
      const vv = variants[k] || {};
      bucket[k] = {
        _id: item._id,
        productName: item.productName,
        selling: item.selling,
        category: item.category,
        subCategory: item.subCategory,
        img: vv?.images?.[0] || item?.img || item?.images?.[0] || null,
        variantColor: vv?.color ?? null,
        variantSize: vv?.size ?? null,
        trandingProduct: !!item.trandingProduct,
        handCraft: !!item.handCraft,
        salesOn:!!item.salesOn,
        displaySalesSlied:!!item.displaySalesSlied,// TODO next time implement it
        createdTs: baseCreatedTs,
        cardKey: `${item._id}::${(vv?.images?.[0] || item?.img || item?.images?.[0] || "noimg")}::${k}`,
      };
    }
    grouped[item._id] = bucket;
    if (maxLen < take) maxLen = take;
  }

  const result = [];
  const keys = Object.keys(grouped);
  for (let col = 0; col < maxLen; col++) {
    for (let j = 0; j < keys.length; j++) {
      const arr = grouped[keys[j]];
      if (arr && arr[col]) result.push(arr[col]);
    }
  }

  return result;
};

