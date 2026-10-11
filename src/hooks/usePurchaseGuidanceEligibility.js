import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import SummaryApi from "../common/SummaryApi";

const HAS_ORDER_KEY_PREFIX = "purchase_guidance_has_order:";
const eligibilityCache = new Map();
const pendingChecks = new Map();

const getUserKey = (userId) => `${HAS_ORDER_KEY_PREFIX}${userId}`;

const checkLoggedInUser = async (userId) => {
  if (eligibilityCache.has(userId)) return eligibilityCache.get(userId);
  if (pendingChecks.has(userId)) return pendingChecks.get(userId);

  const check = (async () => {
    try {
      const storedHasOrder = await AsyncStorage.getItem(getUserKey(userId));
      if (storedHasOrder === "true") {
        eligibilityCache.set(userId, false);
        return false;
      }

      const response = await axios.get(SummaryApi.get_user_orders.url, {
        withCredentials: true,
      });
      const hasOrder =
        response.data?.success &&
        Array.isArray(response.data?.data) &&
        response.data.data.length > 0;

      if (hasOrder) {
        await AsyncStorage.setItem(getUserKey(userId), "true").catch(() => {});
      }

      const eligible = !hasOrder;
      eligibilityCache.set(userId, eligible);
      return eligible;
    } catch {
      // Guidance is safe to show if order history cannot be verified.
      return true;
    } finally {
      pendingChecks.delete(userId);
    }
  })();

  pendingChecks.set(userId, check);
  return check;
};

export const markUserHasOrder = async (userId) => {
  if (!userId) return;
  eligibilityCache.set(userId, false);
  await AsyncStorage.setItem(getUserKey(userId), "true").catch(() => {});
};

const usePurchaseGuidanceEligibility = (userId) => {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    let alive = true;
    let guestTimer;

    if (!userId) {
      // User state starts as null while the app restores a login session. A
      // short delay prevents guidance flashing for returning signed-in users.
      guestTimer = setTimeout(() => {
        if (alive) setEligible(true);
      }, 900);
      return () => {
        alive = false;
        clearTimeout(guestTimer);
      };
    }

    setEligible(false);
    checkLoggedInUser(userId).then((result) => {
      if (alive) setEligible(result);
    });

    return () => {
      alive = false;
    };
  }, [userId]);

  return eligible;
};

export default usePurchaseGuidanceEligibility;
