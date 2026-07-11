import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ANDROID_MARKET_URL = "market://details?id=com.emamexp2.testeasupload";

const AppUpdateModal = ({ visible, updateInfo, onClose }) => {
  const openUpdateUrl = async () => {
    try {
      await Linking.openURL(ANDROID_MARKET_URL);
      return;
    } catch {}

    if (!updateInfo?.playStoreUrl) return;

    try {
      await Linking.openURL(updateInfo.playStoreUrl);
    } catch {}
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close update modal"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {updateInfo?.title || "Update available"}
          </Text>
          <Text style={styles.message}>
            {updateInfo?.message || "A new version of the app is available."}
          </Text>

          <View style={styles.versionBox}>
            <Text style={styles.versionText}>
              Current version: {updateInfo?.currentVersion || "Unknown"}
            </Text>
            <Text style={styles.versionText}>
              Latest version: {updateInfo?.latestVersion || "Unknown"}
            </Text>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={openUpdateUrl}>
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingBottom: 22,
    paddingTop: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  closeText: {
    color: "#555",
    fontSize: 28,
    lineHeight: 30,
  },
  title: {
    marginTop: 6,
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 12,
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  versionBox: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  versionText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  updateButton: {
    marginTop: 20,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  laterButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default AppUpdateModal;
