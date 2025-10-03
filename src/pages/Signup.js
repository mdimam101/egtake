// import { useNavigation } from "@react-navigation/native";
// import axios from "axios";
// import { useContext, useEffect, useState } from "react";
// import {
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Toast from "react-native-toast-message";
// import SummaryApi from "../common/SummaryApi";
// import Context from "../context";
// import { ensureDeviceId, getDeviceId } from "../utils/deviceId";

// const SignupPage = () => {
//   const navigation = useNavigation();

//   const { fetchUserDetails } = useContext(Context);

//   const [data, setData] = useState({
//     email: "",
//     password: "",
//     name: "",
//     confirmPassword: "",
//   });

//   const [errors, setErrors] = useState({
//     email: "",
//     name: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
//   const [readyDeviceId, setReadyDeviceId] = useState(null);

//   // ✅ email validator
//   const isValidEmail = (email) => {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(String(email).toLowerCase());
//   };

//   const handleOnChange = (key, value) => {
//     setData((prev) => ({ ...prev, [key]: value }));
//     setErrors((prev) => ({ ...prev, [key]: "" }));
//   };

//   const handleBlur = (key) => {
//     if (key === "email") {
//       const email = data.email.trim();
//       if (!email) setErrors((p) => ({ ...p, email: "Email is required" }));
//       else if (!isValidEmail(email))
//         setErrors((p) => ({ ...p, email: "Please enter a valid email" }));
//     }
//     if (key === "name" && !data.name.trim()) {
//       setErrors((p) => ({ ...p, name: "Full name is required" }));
//     }
//     if (key === "password") {
//       if (!data.password) setErrors((p) => ({ ...p, password: "Password is required" }));
//       else if (data.password.length < 6)
//         setErrors((p) => ({ ...p, password: "Minimum 6 characters" }));
//     }
//     if (key === "confirmPassword") {
//       if (!data.confirmPassword)
//         setErrors((p) => ({ ...p, confirmPassword: "Confirm your password" }));
//       else if (data.password !== data.confirmPassword)
//         setErrors((p) => ({
//           ...p,
//           confirmPassword: "Password does not match please type again",
//         }));
//     }
//   };

//   // ✅ Make sure a deviceId exists when this screen mounts
//   useEffect(() => {
//     (async () => {
//       const id = await ensureDeviceId();
//       setReadyDeviceId(id);
//     })();
//   }, []);

//   const handleSubmit = async () => {
//     const trimmed = {
//       name: data.name.trim(),
//       email: data.email.trim(),
//       password: data.password,
//       confirmPassword: data.confirmPassword,
//     };

//     const nextErrors = { name: "", email: "", password: "", confirmPassword: "" };

//     if (!trimmed.name) nextErrors.name = "Full name is required";
//     if (!trimmed.email) nextErrors.email = "Email is required";
//     else if (!isValidEmail(trimmed.email))
//       nextErrors.email = "Please enter a valid email";

//     if (!trimmed.password) nextErrors.password = "Password is required";
//     else if (trimmed.password.length < 6)
//       nextErrors.password = "Minimum 6 characters";

//     if (!trimmed.confirmPassword)
//       nextErrors.confirmPassword = "Confirm your password";
//     else if (trimmed.password !== trimmed.confirmPassword)
//       nextErrors.confirmPassword = "Password does not match \nplease type again";

//     if (
//       nextErrors.name ||
//       nextErrors.email ||
//       nextErrors.password ||
//       nextErrors.confirmPassword
//     ) {
//       setErrors(nextErrors);
//       Toast.show({ type: "error", text1: "Please fix the highlighted fields" });
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       const normalizedEmail = trimmed.email.toLowerCase();

//       const response = await axios({
//         method: SummaryApi.signUp.method,
//         url: SummaryApi.signUp.url,
//         headers: { "Content-Type": "application/json" },
//         data: {
//           name: trimmed.name,
//           email: normalizedEmail,
//           password: trimmed.password,
//           confirmPassword: trimmed.confirmPassword,
//         },
//         withCredentials: true,
//       });

//       if (response?.data?.success) {
//         Toast.show({ type: "success", text1: "Account created successfully" });
//         navigation.navigate("Login");
//       } else {
//         Toast.show({
//           type: "error",
//           text1: response?.data?.message || "Signup failed",
//         });
//       }
//     } catch (error) {
//       Toast.show({
//         type: "error",
//         text1: error?.response?.data?.message || "Something went wrong",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

  // // ✅ Guest flow: body তে শুধু { deviceId }
  // const handleGuestContinue = async () => {
  //   try {
  //     setIsGuestSubmitting(true);

  //     // Ensure deviceId (should already be there from useEffect/App bootstrap)
  //     const deviceId = (await getDeviceId()) || (await ensureDeviceId());
  //     if (!deviceId) {
  //       Toast.show({ type: "error", text1: "Failed to get device id" });
  //       return;
  //     }

  //     const res = await axios({
  //       method: SummaryApi.signUp.method, // POST
  //       url: SummaryApi.signUp.url,       // e.g., /api/user/signup
  //       headers: { "Content-Type": "application/json" },
  //       data: { deviceId },               // <<— only deviceId in body
  //       withCredentials: true,
  //     });

  //     if (res?.data?.success) {
  //       Toast.show({ type: "success", text1: "Logged in successfully as guest" });
  //       // navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  //       try {
  //             const response = await axios({
  //               method: SummaryApi.signIn.method,
  //               url: SummaryApi.signIn.url,
  //               headers: { "Content-Type": "application/json" },
  //               withCredentials: true, // ✅ MUST for cookie auth
  //               data: { deviceId },
  //             });
        
  //             if (response.data.success) {
  //               Toast.show({ type: "success", text1: "Login successful" });
  //               fetchUserDetails();
  //               navigation.navigate("Home");
  //             } else {
  //               Toast.show({
  //                 type: "error",
  //                 text1: response.data.message || "Login failed",
  //               });
  //             }
  //           } catch (error) {
  //             Toast.show({ type: "error", text1: "Something went wrong" });
  //           }
  //     } else {
  //       try {
  //             const response = await axios({
  //               method: SummaryApi.signIn.method,
  //               url: SummaryApi.signIn.url,
  //               headers: { "Content-Type": "application/json" },
  //               withCredentials: true, // ✅ MUST for cookie auth
  //               data: { deviceId },
  //             });
        
  //             if (response.data.success) {
  //               Toast.show({ type: "success", text1: "Login successful" });
  //               fetchUserDetails();
  //               navigation.navigate("Home");
  //             // } else {
  //             //   Toast.show({
  //             //     type: "error",
  //             //     text1: response.data.message || "Login failed",
  //             //   });
  //             }
  //           } catch (error) {
  //             Toast.show({ type: "error", text1: "Something went wrong" });
  //           }
  //       Toast.show({
  //         type: "error",
  //         text1: res?.data?.message || "Guest login failed",
  //       });
  //       console.log("Guest login failed:", res?.data);
  //     }
  //   } catch (err) {
  //     Toast.show({
  //       type: "error",
  //       text1: err?.response?.data?.message || "Guest login error",
  //     });
  //   } finally {
  //     setIsGuestSubmitting(false);
  //   }
  // };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       style={styles.container}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollWrapper}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.card}>
//           <Text style={styles.title}>Create Account</Text>

//           <TextInput
//             style={[styles.input, !!errors.name && styles.inputError]}
//             placeholder="Your full name"
//             placeholderTextColor="#888"
//             value={data.name}
//             onChangeText={(text) => handleOnChange("name", text)}
//             onBlur={() => handleBlur("name")}
//             editable={!isSubmitting && !isGuestSubmitting}
//           />
//           {!!errors.name && <Text style={styles.errText}>{errors.name}</Text>}

//           <TextInput
//             style={[styles.input, !!errors.email && styles.inputError]}
//             placeholder="Email address"
//             placeholderTextColor="#888"
//             keyboardType="email-address"
//             autoCapitalize="none"
//             value={data.email}
//             onChangeText={(text) => handleOnChange("email", text)}
//             onBlur={() => handleBlur("email")}
//             editable={!isSubmitting && !isGuestSubmitting}
//           />
//           {!!errors.email && <Text style={styles.errText}>{errors.email}</Text>}

//           <TextInput
//             style={[styles.input, !!errors.password && styles.inputError]}
//             placeholder="Password"
//             placeholderTextColor="#888"
//             secureTextEntry
//             value={data.password}
//             onChangeText={(text) => handleOnChange("password", text)}
//             onBlur={() => handleBlur("password")}
//             editable={!isSubmitting && !isGuestSubmitting}
//           />
//           {!!errors.password && (
//             <Text style={styles.errText}>{errors.password}</Text>
//           )}

//           <TextInput
//             style={[styles.input, !!errors.confirmPassword && styles.inputError]}
//             placeholder="Confirm password"
//             placeholderTextColor="#888"
//             secureTextEntry
//             value={data.confirmPassword}
//             onChangeText={(text) => handleOnChange("confirmPassword", text)}
//             onBlur={() => handleBlur("confirmPassword")}
//             editable={!isSubmitting && !isGuestSubmitting}
//           />
//           {!!errors.confirmPassword && (
//             <Text style={styles.errText}>{errors.confirmPassword}</Text>
//           )}

//           <TouchableOpacity
//             style={[styles.button, (isSubmitting || isGuestSubmitting) && { opacity: 0.6 }]}
//             onPress={handleSubmit}
//             disabled={isSubmitting || isGuestSubmitting}
//             activeOpacity={isSubmitting || isGuestSubmitting ? 1 : 0.7}
//           >
//             <Text style={styles.buttonText}>
//               {isSubmitting ? "Creating..." : "Sign Up"}
//             </Text>
//           </TouchableOpacity>

//           {/* --- Divider + Guest CTA under Create Account --- */}
//           <View style={styles.dividerRow}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>or</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           <TouchableOpacity
//             style={[
//               styles.guestBtn,
//               (!readyDeviceId || isGuestSubmitting || isSubmitting) && { opacity: 0.6 },
//             ]}
//             onPress={handleGuestContinue}
//             disabled={!readyDeviceId || isGuestSubmitting || isSubmitting}
//           >
//             <Text style={styles.guestBtnText}>
//               {isGuestSubmitting ? "Continuing..." : "Continue to login as Guest"}
//             </Text>
//             <Text style={styles.guestHint}>
//               No email or phone number required
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => !isSubmitting && !isGuestSubmitting && navigation.navigate("Login")}
//           >
//             <Text style={styles.footerText}>
//               Already have an account?{" "}
//               <Text style={styles.linkText}>Login</Text>
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//       <Toast />
//     </KeyboardAvoidingView>
//   );
// };

// export default SignupPage;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f9fafb" },
//   scrollWrapper: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
//   card: {
//     width: "100%", maxWidth: 380, backgroundColor: "#fff", borderRadius: 16, padding: 24,
//     shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
//   },
//   title: { fontSize: 26, fontWeight: "700", marginBottom: 20, color: "#333", textAlign: "center" },
//   input: {
//     backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
//     fontSize: 16, marginBottom: 10, borderColor: "#ddd", borderWidth: 1, color: "#111",
//   },
//   inputError: { borderColor: "#e53935" },
//   errText: { color: "#e53935", marginBottom: 8, marginLeft: 4, fontSize: 12 },
//   button: { backgroundColor: "#1e90ff", paddingVertical: 16, borderRadius: 12, marginTop: 6 },
//   buttonText: { textAlign: "center", color: "#fff", fontWeight: "700", fontSize: 18 },

//   footerText: { marginTop: 20, textAlign: "center", fontSize: 14, color: "#555" },
//   linkText: { color: "#1e90ff", fontWeight: "600" },

//   dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
//   dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
//   dividerText: { marginHorizontal: 10, color: "#6b7280", fontSize: 12 },

//   guestBtn: {
//     borderWidth: 1, borderColor: "#cfd8e3", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
//     backgroundColor: "#fff", marginTop: 4,
//   },
//   guestBtnText: { textAlign: "center", fontSize: 16, fontWeight: "700", color: "#111" },
//   guestHint: { textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 4 },
// });
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
  const [readyDeviceId, setReadyDeviceId] = useState(null);

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
        url: SummaryApi.signUp.url,       // e.g., /api/user/signup
        headers: { "Content-Type": "application/json" },
        data: { deviceId },               // <<— only deviceId in body
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
            } catch (error) {
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
            } catch (error) {
              Toast.show({ type: "error", text1: "Something went wrong" });
            }
        Toast.show({
          type: "error",
          text1: res?.data?.message || "Guest login failed",
        });
        console.log("Guest login failed:", res?.data);
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
          <Text style={styles.brand}>EgTake</Text>
          <Text style={styles.tagline}>Shop with confidence</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Continue as Guest</Text>
          <Text style={styles.subText}>
            One-tap login. No email or phone required.
          </Text>

          <TouchableOpacity
            style={[
              styles.guestBtn,
              (!readyDeviceId || isGuestSubmitting) && { opacity: 0.6 },
            ]}
            onPress={handleGuestContinue}
            disabled={!readyDeviceId || isGuestSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>
              {isGuestSubmitting ? "Logging in..." : "Continue"}
            </Text>
            <Text style={styles.guestHint}>
              We’ll create a secure guest session for this device.
            </Text>
          </TouchableOpacity>
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
  },

  guestBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginTop: 18,
  },
  guestBtnText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  guestHint: { textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 6 },
});
