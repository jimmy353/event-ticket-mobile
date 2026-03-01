// ONLY CHANGES:
// 1. role state removed
// 2. role selector UI removed
// 3. role checks removed
// 4. role always "customer"

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";
import { useGoogleAuth } from "../services/googleAuth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication.accessToken;
      googleLogin(token);
    }
  }, [response]);

  // ==========================
  // LOGIN
  // ==========================
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login-role/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role: "customer", // 🔥 FORCE CUSTOMER
        }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        Alert.alert(
          "Server Error",
          "Backend returned invalid response."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.status === "not_verified") {
          Alert.alert(
            "Login Failed",
            "Email not verified. Please verify your email OTP first."
          );

          navigation.navigate("VerifyOTP", { email });
          setLoading(false);
          return;
        }

        Alert.alert(
          "Login Failed",
          data.detail || data.error || "Invalid credentials"
        );
        setLoading(false);
        return;
      }

      if (!data.access || !data.refresh) {
        Alert.alert("Error", "Invalid token response from server");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("access", data.access);
      await AsyncStorage.setItem("refresh", data.refresh);
      await AsyncStorage.setItem("role", "customer");

      Alert.alert("Success", "Login successful!");

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  };

  // ==========================
  // FORGOT PASSWORD
  // ==========================
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiFetch("/api/auth/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Failed", data.detail || data.error || "Try again");
        setForgotLoading(false);
        return;
      }

      Alert.alert("OTP Sent ✅", "Password reset OTP has been sent to your email.");

      setForgotVisible(false);
      navigation.navigate("ResetPassword", { email: forgotEmail });

      setForgotEmail("");
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    }

    setForgotLoading(false);
  };

  // ==========================
  // Google Login
  // ==========================
  const googleLogin = async (accessToken) => {
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/google/", {
        method: "POST",
        body: JSON.stringify({
          access_token: accessToken,
          role: "customer",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Google Login Failed", data.detail || data.error || "Try again");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("access", data.access);
      await AsyncStorage.setItem("refresh", data.refresh);
      await AsyncStorage.setItem("role", "customer");

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  };

  const facebookLogin = () => {
    Alert.alert("Coming Soon", "Facebook login coming soon");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        onPress={() => {
          setForgotEmail(email);
          setForgotVisible(true);
        }}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Pressable>

      <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </Pressable>

      <Pressable style={styles.socialBtn} onPress={promptAsync}>
        <Ionicons name="logo-google" size={22} color="#fff" />
        <Text style={styles.socialText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        style={[styles.socialBtn, { borderColor: "#1877F2" }]}
        onPress={facebookLogin}
      >
        <Ionicons name="logo-facebook" size={22} color="#1877F2" />
        <Text style={styles.socialText}>Continue with Facebook</Text>
      </Pressable>

      <Text style={styles.bottomText}>
        Don’t have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>

      <Modal visible={forgotVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Forgot Password</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#666"
              style={styles.modalInput}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.modalBtn}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalBtnText}>Send OTP</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.modalCancel}
              onPress={() => setForgotVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    color: "#7CFF00",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },

  input: {
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },

  forgotText: {
    color: "#7CFF00",
    textAlign: "right",
    marginBottom: 15,
    fontWeight: "bold",
  },

  loginBtn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 18,
  },

  loginText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  bottomText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 22,
    fontSize: 14,
  },

  link: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 12,
    gap: 10,
  },

  socialText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    backgroundColor: "#111",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(124,255,0,0.3)",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7CFF00",
    marginBottom: 10,
    textAlign: "center",
  },

  modalInput: {
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },

  modalBtn: {
    backgroundColor: "#7CFF00",
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  modalBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },

  modalCancel: {
    marginTop: 12,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#aaa",
    fontWeight: "bold",
  },
});