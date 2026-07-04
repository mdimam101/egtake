import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import SummaryApi from "../common/SummaryApi";
import Context from "../context";
import { ensureDeviceId, getDeviceId } from "../utils/deviceId";

const SignupPage = () => {
  const navigation = useNavigation();
  const { fetchUserDetails } = useContext(Context);

  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [readyDeviceId, setReadyDeviceId] = useState(null);

  const webClientId =
    "718012493910-ktti7v3cq77u5qi6so6dvjs3hup22a3t.apps.googleusercontent.com";

  useEffect(() => {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleSubmitting(true);
      // Check Google Play Services availability
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Open native Google Sign-In UI
      const userInfo = await GoogleSignin.signIn();
      // Depending on library version, idToken can be in userInfo.data.idToken or userInfo.idToken
      const credential = userInfo?.data?.idToken || userInfo?.idToken;
      if (!credential) {
        Toast.show({
          type: "error",
          text1: "Google ID token not found",
        });
        return;
      }
      const apiResponse = await axios({
        method: SummaryApi.google_login.method,
        url: SummaryApi.google_login.url,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        data: { credential },
      });
      if (apiResponse?.data?.success) {
        Toast.show({
          type: "success",
          text1: "Google login successful",
        });
        await fetchUserDetails?.();
        navigation.navigate("Home");
      } else {
        Toast.show({
          type: "error",
          text1: apiResponse?.data?.message || "Google login failed",
        });
      }
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        Toast.show({
          type: "info",
          text1: "Google login cancelled",
        });
        return;
      }
      if (error?.code === statusCodes.IN_PROGRESS) {
        Toast.show({
          type: "info",
          text1: "Google login already in progress",
        });
        return;
      }
      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({
          type: "error",
          text1: "Google Play Services not available",
        });
        return;
      }
      console.log("Google login error:", error);
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ||
          error?.message ||
          "Google login failed",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // Ensure deviceId exists when screen mounts
  useEffect(() => {
    (async () => {
      const id = await ensureDeviceId();
      setReadyDeviceId(id);
    })();
  }, []);

  // ✅ Guest flow: body তে শুধু { deviceId }
  const handleGuestContinue = async () => {
    try {
      setIsGuestSubmitting(true);

      // Ensure deviceId (should already be there from useEffect/App bootstrap)
      const deviceId = (await getDeviceId()) || (await ensureDeviceId());
      if (!deviceId) {
        Toast.show({ type: "error", text1: "Failed to get device id" });
        return;
      }

      const res = await axios({
        method: SummaryApi.signUp.method, // POST
        url: SummaryApi.signUp.url, // e.g., /api/user/signup
        headers: { "Content-Type": "application/json" },
        data: { deviceId }, // <<— only deviceId in body
        withCredentials: true,
      });

      if (res?.data?.success) {
        try {
          const response = await axios({
            method: SummaryApi.signIn.method,
            url: SummaryApi.signIn.url,
            headers: { "Content-Type": "application/json" },
            withCredentials: true, // ✅ MUST for cookie auth
            data: { deviceId },
          });

          if (response.data.success) {
            Toast.show({ type: "success", text1: "Login successful" });
            fetchUserDetails();
            navigation.navigate("Home");
          } else {
            Toast.show({
              type: "error",
              text1: response.data.message || "Login failed",
            });
          }
        } catch (_error) {
          Toast.show({ type: "error", text1: "Something went wrong" });
        }
      } else {
        try {
          const response = await axios({
            method: SummaryApi.signIn.method,
            url: SummaryApi.signIn.url,
            headers: { "Content-Type": "application/json" },
            withCredentials: true, // ✅ MUST for cookie auth
            data: { deviceId },
          });

          if (response.data.success) {
            Toast.show({ type: "success", text1: "Login successful" });
            fetchUserDetails();
            navigation.navigate("Home");
          } else {
            Toast.show({
              type: "error",
              text1: response.data.message || "Login failed",
            });
          }
        } catch (_error) {
          Toast.show({ type: "error", text1: "Something went wrong" });
        }
        Toast.show({
          type: "error",
          text1: res?.data?.message || "Guest login failed",
        });
        // console.log("Guest login failed:", res?.data);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Guest login error",
      });
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollWrapper}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.brand}>Pyzara</Text>
          <Text style={styles.tagline}>Shop with confidence...</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subText}>Continue with Google</Text>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              (!webClientId || isGoogleSubmitting) && { opacity: 0.6 },
            ]}
            onPress={handleGoogleLogin}
            disabled={!webClientId || isGoogleSubmitting || isGuestSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.googleBtnText}>
              {isGoogleSubmitting
                ? "Google logging in..."
                : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {!webClientId && (
            <Text style={styles.googleError}>Google Client ID not found</Text>
          )}

          {/* <Text style={styles.orText}>or</Text>
          <Text style={styles.title}>Continue as Guest</Text>
          <Text style={styles.subText}>
            One-tap login. No email or phone required.
          </Text>

          <TouchableOpacity
            style={[
              styles.guestBtn,
              (!readyDeviceId || isGuestSubmitting || isGoogleSubmitting) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleGuestContinue}
            disabled={!readyDeviceId || isGuestSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>
              {isGuestSubmitting ? "Logging in..." : "Continue as Guest"}
            </Text>
            <Text style={styles.guestHint}>
              We’ll create a secure guest session for this device.
            </Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa" },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Brand header
  headerWrap: { alignItems: "center", marginBottom: 12 },
  brand: { fontSize: 28, fontWeight: "800", color: "#111" },
  tagline: { marginTop: 4, fontSize: 12, color: "#6b7280", letterSpacing: 0.4 },

  // Card
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 16,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  googleBtnText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  googleError: {
    marginTop: 10,
    textAlign: "center",
    color: "#dc2626",
    fontSize: 12,
  },
  orText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    marginVertical: 12,
  },

  guestBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    // marginTop: 18,
  },
  guestBtnText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  guestHint: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
  },
});
