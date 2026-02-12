import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";
import { useGoogleAuth } from "../services/googleAuth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);

  const { response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication.accessToken;

      if (role === "organizer") {
        Alert.alert("Not Allowed", "Google login is only available for customers.");
        return;
      }

      googleLogin(token);
    }
  }, [response]);

  // ✅ LOGIN
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
          role,
        }),
      });

      const data = await safeJson(res);

      // ❌ Backend returned HTML
      if (data?.raw) {
        console.log("❌ LOGIN RESPONSE (NOT JSON):", data.raw);

        Alert.alert(
          "Server Error",
          "Backend returned invalid response. Check backend endpoint."
        );

        setLoading(false);
        return;
      }

      // ❌ LOGIN FAILED
      if (!res.ok) {
        if (data.status === "pending") {
          Alert.alert(
            "Request Pending",
            "Thank you, we’re reviewing your request.\n\nCome back and login after approval in 1 to 3 days."
          );
          setLoading(false);
          return;
        }

        if (data.status === "rejected") {
          Alert.alert(
            "Request Rejected",
            "Sorry, your organizer request was rejected.\n\nPlease contact support."
          );
          setLoading(false);
          return;
        }

        if (data.status === "not_requested") {
          Alert.alert(
            "Not Registered",
            "You have not submitted an organizer request.\n\nPlease sign up as an organizer first."
          );
          setLoading(false);
          return;
        }

        Alert.alert("Login Failed", data.detail || data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // ✅ LOGIN SUCCESS
      if (!data.access || !data.refresh) {
        Alert.alert("Error", "Invalid token response from server");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("access", data.access);
      await AsyncStorage.setItem("refresh", data.refresh);
      await AsyncStorage.setItem("role", role);

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

  // ✅ Google Login
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

      if (data?.raw) {
        console.log("❌ GOOGLE LOGIN RESPONSE (NOT JSON):", data.raw);

        Alert.alert(
          "Server Error",
          "Backend returned invalid response. Check Google login endpoint."
        );

        setLoading(false);
        return;
      }

      if (!res.ok) {
        Alert.alert("Google Login Failed", data.detail || data.error || "Try again");
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

      Alert.alert("Success", "Google login successful!");

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
    if (role === "organizer") {
      Alert.alert("Not Allowed", "Facebook login is only available for customers.");
      return;
    }

    Alert.alert("Coming Soon", "Facebook login coming soon");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* ROLE SELECT */}
      <View style={styles.roleBox}>
        <Pressable
          style={[styles.roleBtn, role === "customer" && styles.roleActive]}
          onPress={() => setRole("customer")}
        >
          <Text
            style={[
              styles.roleText,
              role === "customer" && styles.roleTextActive,
            ]}
          >
            Customer
          </Text>
        </Pressable>

        <Pressable
          style={[styles.roleBtn, role === "organizer" && styles.roleActive]}
          onPress={() => setRole("organizer")}
        >
          <Text
            style={[
              styles.roleText,
              role === "organizer" && styles.roleTextActive,
            ]}
          >
            Organizer
          </Text>
        </Pressable>
      </View>

      {/* EMAIL */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* PASSWORD */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* LOGIN BUTTON */}
      <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </Pressable>

      {/* GOOGLE LOGIN */}
      <Pressable
        style={styles.socialBtn}
        onPress={() => {
          if (role === "organizer") {
            Alert.alert("Not Allowed", "Google login is only available for customers.");
            return;
          }
          promptAsync();
        }}
      >
        <Ionicons name="logo-google" size={22} color="#fff" />
        <Text style={styles.socialText}>Continue with Google</Text>
      </Pressable>

      {/* FACEBOOK LOGIN */}
      <Pressable
        style={[styles.socialBtn, { borderColor: "#1877F2" }]}
        onPress={facebookLogin}
      >
        <Ionicons name="logo-facebook" size={22} color="#1877F2" />
        <Text style={styles.socialText}>Continue with Facebook</Text>
      </Pressable>

      {/* SIGN UP LINK */}
      <Text style={styles.bottomText}>
        Don’t have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

/* ================== STYLES ================== */
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

  loginBtn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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

  roleBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 10,
  },

  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  roleActive: {
    backgroundColor: "#7CFF00",
  },

  roleText: {
    fontWeight: "bold",
    color: "#fff",
  },

  roleTextActive: {
    color: "#000",
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
});