// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Platform } from "react-native";
// import { v4 as uuidv4 } from "uuid";

// const KEY = "pyzara:deviceId";
// let pendingDeviceId = null;

// export function ensureDeviceId() {
//   if (!pendingDeviceId) {
//     pendingDeviceId = (async () => {
//       const existing = await AsyncStorage.getItem(KEY);
//       if (existing) return existing;

//       const id = `egtake_${uuidv4()}_${Platform.OS}`;
//       await AsyncStorage.setItem(KEY, id);
//       return id;
//     })().finally(() => {
//       pendingDeviceId = null;
//     });
//   }

//   return pendingDeviceId;
// }

// export function getDeviceId() {
//   return AsyncStorage.getItem(KEY);
// }

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const KEY = "pyzara:deviceId";

/**
 * Get Original Device ID
 */
async function getOriginalDeviceId() {
  try {
    let deviceId = null;

    if (Platform.OS === "android") {
      deviceId = Application.getAndroidId();
    }

    if (Platform.OS === "ios") {
      deviceId = await Application.getIosIdForVendorAsync();
    }

    if (typeof deviceId === "string" && deviceId.trim()) {
      return `egtake_${deviceId.trim()}_${Platform.OS}`;
    }

    return null;
  } catch (error) {
    console.warn("Original Device ID unavailable:", error);
    return null;
  }
}

/**
 * Ensure Device ID
 *
 * Priority:
 * 1. Original Device ID
 * 2. Existing Saved Device ID
 * 3. Generate UUID
 */
export async function ensureDeviceId() {
  // Step 1: Try original device ID
  const originalId = await getOriginalDeviceId();

  if (originalId) {
    try {
      const savedId = await AsyncStorage.getItem(KEY);

      if (savedId !== originalId) {
        await AsyncStorage.setItem(KEY, originalId);
      }
    } catch (error) {
      console.warn("Device ID storage error:", error);
    }

    return originalId;
  }

  // Step 2: Check previously saved ID
  try {
    const savedId = await AsyncStorage.getItem(KEY);

    if (savedId) {
      return savedId;
    }
  } catch (error) {
    console.warn("Device ID read error:", error);
  }

  // Step 3: Generate fallback UUID
  const fallbackId = `egtake_${uuidv4()}_${Platform.OS}`;

  try {
    await AsyncStorage.setItem(KEY, fallbackId);
  } catch (error) {
    console.warn("Device ID save error:", error);
  }

  return fallbackId;
}
