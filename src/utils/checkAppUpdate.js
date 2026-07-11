import axios from "axios";
import Constants from "expo-constants";
import SummaryApi from "../common/SummaryApi";

export const getInstalledAppVersion = () => {
  return (
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    Constants.manifest?.version ||
    null
  );
};

export const checkAppUpdate = async () => {
  const currentVersion = getInstalledAppVersion();

  if (!currentVersion || !SummaryApi.app_version?.url) {
    return null;
  }

  try {
    const response = await axios.get(SummaryApi.app_version.url, {
      params: {
        platform: "android",
        currentVersion,
      },
    });

    const data = response?.data;

    if (!data?.success || !data?.updateAvailable) {
      return null;
    }

    return {
      title: data.title || "Update available",
      message: data.message || "A new version of the app is available.",
      currentVersion: data.currentVersion || currentVersion,
      latestVersion: data.latestVersion || "",
      playStoreUrl: data.playStoreUrl || "",
    };
  } catch {
    return null;
  }
};
