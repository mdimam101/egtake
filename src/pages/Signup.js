import { Ionicons } from "@expo/vector-icons";
// import {
//   GoogleSignin,
//   statusCodes,
// } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
    // GoogleSignin.configure({
    //   webClientId,
    //   offlineAccess: false,
    // });
  }, []);

  // const handleGoogleLogin = async () => {
  //   try {
  //     setIsGoogleSubmitting(true);
  //     // Check Google Play Services availability
  //     await GoogleSignin.hasPlayServices({
  //       showPlayServicesUpdateDialog: true,
  //     });
  //     // Open native Google Sign-In UI
  //     const userInfo = await GoogleSignin.signIn();
  //     // Depending on library version, idToken can be in userInfo.data.idToken or userInfo.idToken
  //     const credential = userInfo?.data?.idToken || userInfo?.idToken;
  //     if (!credential) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Google ID token not found",
  //       });
  //       return;
  //     }
  //     const apiResponse = await axios({
  //       method: SummaryApi.google_login.method,
  //       url: SummaryApi.google_login.url,
  //       headers: { "Content-Type": "application/json" },
  //       withCredentials: true,
  //       data: { credential },
  //     });
  //     if (apiResponse?.data?.success) {
  //       Toast.show({
  //         type: "success",
  //         text1: "Google login successful",
  //       });
  //       await fetchUserDetails?.();
  //       navigation.navigate("Home");
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text1: apiResponse?.data?.message || "Google login failed",
  //       });
  //     }
  //   } catch (error) {
  //     if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
  //       Toast.show({
  //         type: "info",
  //         text1: "Google login cancelled",
  //       });
  //       return;
  //     }
  //     if (error?.code === statusCodes.IN_PROGRESS) {
  //       Toast.show({
  //         type: "info",
  //         text1: "Google login already in progress",
  //       });
  //       return;
  //     }
  //     if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Google Play Services not available",
  //       });
  //       return;
  //     }
  //     console.log("Google login error:", error);
  //     Toast.show({
  //       type: "error",
  //       text1:
  //         error?.response?.data?.message ||
  //         error?.message ||
  //         "Google login failed",
  //     });
  //   } finally {
  //     setIsGoogleSubmitting(false);
  //   }
  // };

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
      <LinearGradient
        colors={["#edfdf4", "#f8fafc", "#eef4ff"]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.decorativeOrb, styles.orbTop]} />
      <View style={[styles.decorativeOrb, styles.orbBottom]} />
      <ScrollView
        contentContainerStyle={styles.scrollWrapper}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={["#16a34a", "#047857"]}
            style={styles.brandIcon}
          >
            <Ionicons name="bag-handle-outline" size={29} color="#fff" />
          </LinearGradient>
          <Text style={styles.brand}>Pyzara</Text>
          <Text style={styles.tagline}>Shop with confidence...</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.securePill}>
            <Ionicons name="shield-checkmark" size={14} color="#047857" />
            <Text style={styles.securePillText}>SECURE SIGN IN</Text>
          </View>
          <Text style={styles.title}>আপনার শপিং শুরু করুন</Text>
          <Text style={styles.subText}>
            এক ট্যাপেই নিরাপদে প্রবেশ করুন—আলাদা পাসওয়ার্ড মনে রাখার প্রয়োজন
            নেই।
          </Text>

          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash-outline" size={17} color="#2563eb" />
              <Text style={styles.benefitText}>দ্রুত প্রবেশ</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefitItem}>
              <Ionicons name="lock-closed-outline" size={17} color="#7c3aed" />
              <Text style={styles.benefitText}>নিরাপদ তথ্য</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefitItem}>
              <Ionicons name="receipt-outline" size={17} color="#ea580c" />
              <Text style={styles.benefitText}>অর্ডার ট্র্যাকিং</Text>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              (!webClientId || isGoogleSubmitting) && { opacity: 0.6 },
            ]}
            // onPress={handleGoogleLogin}
            disabled={!webClientId || isGoogleSubmitting || isGuestSubmitting}
            activeOpacity={0.8}
          >
            {isGoogleSubmitting ? (
              <ActivityIndicator size="small" color="#1e293b" />
            ) : (
              <View style={styles.googleIconWrap}>
                <Ionicons name="logo-google" size={22} color="#4285F4" />
              </View>
            )}
            <Text style={styles.googleBtnText}>
              {isGoogleSubmitting
                ? "Google logging in..."
                : "Continue with Google"}
            </Text>
            {!isGoogleSubmitting && (
              <Ionicons name="arrow-forward" size={19} color="#64748b" />
            )}
          </TouchableOpacity>

          {!webClientId && (
            <Text style={styles.googleError}>Google Client ID not found</Text>
          )}
          {/* <View style={styles.privacyNote}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#64748b"
            />
            <Text style={styles.privacyText}>
              আমরা আপনার Google password দেখি না বা সংরক্ষণ করি না।
            </Text>
          </View> */}

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
        <View style={styles.trustFooter}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.trustFooterText}>
            নিরাপদ লগইন • সহজ অর্ডার • বিশ্বস্ত সেবা
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 34,
  },
  decorativeOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.08)",
  },
  orbTop: { width: 210, height: 210, top: -85, right: -78 },
  orbBottom: {
    width: 260,
    height: 260,
    bottom: -130,
    left: -115,
    backgroundColor: "rgba(59,130,246,0.07)",
  },

  // Brand header
  headerWrap: { alignItems: "center", marginBottom: 24 },
  brandIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    marginBottom: 10,
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 7,
  },
  brand: {
    fontSize: 31,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.7,
  },
  tagline: { marginTop: 3, fontSize: 12.5, color: "#64748b" },

  // Card
  card: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.95)",
    paddingHorizontal: 22,
    paddingVertical: 25,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 8,
  },
  securePill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    marginBottom: 13,
  },
  securePillText: {
    color: "#047857",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.25,
  },
  subText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748b",
    fontSize: 13.2,
    lineHeight: 20,
    paddingHorizontal: 5,
  },
  benefitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  benefitItem: { flex: 1, alignItems: "center", gap: 5 },
  benefitText: {
    color: "#475569",
    fontSize: 9.7,
    fontWeight: "700",
    textAlign: "center",
  },
  benefitDivider: {
    width: StyleSheet.hairlineWidth,
    height: 31,
    backgroundColor: "#cbd5e1",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#cbd5e1",
  },
  dividerText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },
  googleBtn: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  googleIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  googleBtnText: {
    flex: 1,
    textAlign: "left",
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1e293b",
    marginHorizontal: 12,
  },
  googleError: {
    marginTop: 10,
    textAlign: "center",
    color: "#dc2626",
    fontSize: 12,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    marginTop: 15,
    paddingHorizontal: 8,
  },
  privacyText: { flex: 1, color: "#64748b", fontSize: 10.7, lineHeight: 16 },
  trustFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trustFooterText: { color: "#64748b", fontSize: 10.5, fontWeight: "600" },
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
