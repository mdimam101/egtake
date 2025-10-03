import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import SummaryApi from "../common/SummaryApi";
import Context from "../context";
import { ensureDeviceId, getDeviceId } from "../utils/deviceId";

const LoginPage = () => {
  const infoText = "Don't have an account?";
  const navigation = useNavigation();
  const { fetchUserDetails } = useContext(Context);

  const [data, setData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false); // 🔒 prevent double press

  const handleOnChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // ✅ Always normalize email before API call
    const normalizedEmail = (data.email || "").trim().toLowerCase();
     const deviceId = (await getDeviceId()) || (await ensureDeviceId());

    try {
      const response = await axios({
        method: SummaryApi.signIn.method,
        url: SummaryApi.signIn.url,
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // ✅ MUST for cookie auth
        data: {
          email: normalizedEmail,   // <<— force lowercase here
          password: data.password,
        },
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={data.email}
            onChangeText={(text) => handleOnChange("email", text)}
            editable={!isSubmitting}
            selectionColor="#1e90ff"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#888"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            autoCorrect={false}
            value={data.password}
            onChangeText={(text) => handleOnChange("password", text)}
            editable={!isSubmitting}
            selectionColor="#1e90ff"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {/* <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            disabled={isSubmitting}
          >
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>
                {isSubmitting ? "Logging in..." : "Login"}
              </Text>
              {isSubmitting && (
                <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            disabled={isSubmitting}
          >
            <Text style={styles.footerText}>
              {infoText} <Text style={styles.linkText}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderColor: "#ddd",
    borderWidth: 1,
    color: "#111", // ✅ visible text
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  footerText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  linkText: {
    color: "#1e90ff",
    fontWeight: "600",
  },
  link: {
    color: "#1e90ff",
    textAlign: "right",
    marginBottom: 10,
  },
});
