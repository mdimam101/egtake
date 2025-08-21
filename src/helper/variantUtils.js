// helpers/variantUtils.js

export const generateOptimizedVariants = (products) => {
  const groupedVariants = {};

  for (let item of products) {
    const variants = item.variants || [];
    const maxShow =
      variants.length >= 7 ? 4 :
      variants.length >= 5 ? 3 :
      variants.length >= 2 ? 2 : 1;

    for (let i = 0; i < Math.min(maxShow, variants.length); i++) {
      const variant = {
        _id: item._id,
        productName: item.productName,
        selling: item.selling,
        category: item.category,
        subCategory: item.subCategory,
        img: variants[i]?.images?.[0],
        variantColor: variants[i]?.color || null,
        variantSize: variants[i]?.size || null,
        trandingProduct: item.trandingProduct,
      };

      if (!groupedVariants[item._id]) groupedVariants[item._id] = [];
      groupedVariants[item._id].push(variant);
    }
  }

  const result = [];
  const maxVariants = Math.max(
    ...Object.values(groupedVariants).map((g) => g.length)
  );

  for (let i = 0; i < maxVariants; i++) {
    for (const group of Object.values(groupedVariants)) {
      if (group[i]) result.push(group[i]);
    }
  }

  return result;
};
