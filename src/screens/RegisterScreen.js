import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiFetch } from "../services/api";

/* ===========================
   REGISTER SCREEN
=========================== */

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        Alert.alert("Register Failed");
        setLoading(false);
        return;
      }

      Alert.alert("Account Created ✅");
      navigation.navigate("Login");
    } catch {
      Alert.alert("Error", "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <Animated.View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#000000", "#040404", "#0a0a0a"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Sirheart Events</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <Animated.View style={[styles.card, { opacity: cardAnim }]}>
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

          <Pressable style={styles.button} onPress={handleRegister}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },

  brand: {
    color: "#7CFF00",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 40,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
  },

  button: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});