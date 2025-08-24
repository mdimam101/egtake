// helpers/variantUtils.js

// export const generateOptimizedVariants = (products) => {
//   const groupedVariants = {};

//   for (let item of products) {
//     const variants = item.variants || [];
//     const maxShow =
//       variants.length >= 7 ? 4 :
//       variants.length >= 5 ? 3 :
//       variants.length >= 2 ? 2 : 1;

//     for (let i = 0; i < Math.min(maxShow, variants.length); i++) {
//       const variant = {
//         _id: item._id,
//         productName: item.productName,
//         selling: item.selling,
//         category: item.category,
//         subCategory: item.subCategory,
//         img: variants[i]?.images?.[0],
//         variantColor: variants[i]?.color || null,
//         variantSize: variants[i]?.size || null,
//         trandingProduct: item.trandingProduct,
//       };

//       if (!groupedVariants[item._id]) groupedVariants[item._id] = [];
//       groupedVariants[item._id].push(variant);
//     }
//   }

//   const result = [];
//   const maxVariants = Math.max(
//     ...Object.values(groupedVariants).map((g) => g.length)
//   );

//   for (let i = 0; i < maxVariants; i++) {
//     for (const group of Object.values(groupedVariants)) {
//       if (group[i]) result.push(group[i]);
//     }
//   }

//   return result;
// };

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

    const maxShow =
      variants.length >= 7 ? 4 :
      variants.length >= 5 ? 3 :
      variants.length >= 2 ? 2 : 1;

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
        createdTs: baseCreatedTs,
        cardKey: `${item._id}::${(item?.img || item?.images?.[0] || "noimg")}`,
      };
      grouped[item._id] = [v];
      if (maxLen < 1) maxLen = 1;
      continue;
    }

    const take = Math.min(maxShow, variants.length);
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

