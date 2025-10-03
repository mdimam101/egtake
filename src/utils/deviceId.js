// utils/deviceId.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const KEY = "egtake:deviceId";

/** Ensure there is a deviceId in storage; returns it */
export async function ensureDeviceId() {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = `egtake_${uuidv4()}_${Platform.OS}`;
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}

/** Read deviceId if already created (may be null) */
export async function getDeviceId() {
  return AsyncStorage.getItem(KEY);
}
