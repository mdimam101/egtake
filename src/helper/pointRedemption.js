const isNonNegativeSafeInteger = (value) =>
  Number.isSafeInteger(value) && value >= 0;

const isValidAmount = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= Number.MAX_SAFE_INTEGER;

/**
 * Preview the backend's redemption limits. One point pays for one taka of
 * merchandise; delivery and other checkout fees never increase this allowance.
 */
export const calculatePointRedemption = ({
  items = [],
  user,
  redemption,
  couponDiscount = 0,
} = {}) => {
  const configuredPercent =
    user?.hasPlacedFirstOrder === true
      ? redemption?.subsequentOrderPercent
      : redemption?.firstOrderPercent;
  const validPercent =
    typeof configuredPercent === "number" &&
    Number.isFinite(configuredPercent) &&
    configuredPercent >= 0 &&
    configuredPercent <= 100;
  const validItemLimit = isValidAmount(redemption?.maxPointsPerItem);
  const validOrderLimit = isValidAmount(redemption?.maxPointsPerOrder);
  const percent = validPercent ? configuredPercent : 0;
  const balance = isNonNegativeSafeInteger(user?.point) ? user.point : 0;
  // The schema permits decimal limits, but orders redeem whole points only.
  const itemLimit = validItemLimit
    ? Math.floor(redemption.maxPointsPerItem)
    : 0;
  const orderLimit = validOrderLimit
    ? Math.floor(redemption.maxPointsPerOrder)
    : 0;
  const result = {
    percent,
    balance,
    maxUsablePoints: 0,
    itemLimit,
    orderLimit,
  };

  // Wait for usable server configuration rather than guessing campaign limits.
  if (
    !validPercent ||
    !validItemLimit ||
    !validOrderLimit ||
    !Array.isArray(items) ||
    !isValidAmount(couponDiscount) ||
    balance === 0 ||
    itemLimit === 0 ||
    orderLimit === 0 ||
    percent === 0
  ) {
    return result;
  }

  let merchandiseSubtotal = 0;
  let eligibleItemPoints = 0;

  for (const item of items) {
    const unitSelling = item?.selling ?? item?.productId?.selling;
    const quantity = item?.quantity;
    if (
      !isValidAmount(unitSelling) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    const lineSubtotal = unitSelling * quantity;
    if (!isValidAmount(lineSubtotal)) continue;

    merchandiseSubtotal += lineSubtotal;
    if (!isValidAmount(merchandiseSubtotal)) return result;

    // The per-item ceiling applies to each physical unit, including quantity.
    const pointsPerUnit = Math.min(
      Math.floor((unitSelling * percent) / 100),
      itemLimit,
    );
    // Saturate at the order ceiling while summing so large quantities cannot
    // produce an unsafe integer in the result.
    eligibleItemPoints = Math.min(
      orderLimit,
      eligibleItemPoints + pointsPerUnit * quantity,
    );
  }

  return {
    ...result,
    maxUsablePoints: Math.min(
      eligibleItemPoints,
      orderLimit,
      balance,
      Math.floor(Math.max(0, merchandiseSubtotal - couponDiscount)),
    ),
  };
};
