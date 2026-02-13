import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("customer");

  const [companyName, setCompanyName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [idFile, setIdFile] = useState(null);

  const [loading, setLoading] = useState(false);

  // ✅ Pick ID Document
  const pickIdDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIdFile(file);

      Alert.alert("Uploaded", "ID Document selected successfully ✅");
    } catch (err) {
      Alert.alert("Error", "Failed to select file");
    }
  };

  // ✅ Register
  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Full Name, Email and Password are required");
      return;
    }

    if (!phone) {
      Alert.alert("Error", "Phone number is required");
      return;
    }

    if (role === "organizer") {
      if (!companyName || !momoNumber || !idFile) {
        Alert.alert(
          "Error",
          "Company name, MoMo number and ID document are required for organizers"
        );
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("password2", password);
      formData.append("role", role);

      if (role === "organizer") {
        formData.append("company_name", companyName);
        formData.append("momo_number", momoNumber);

        formData.append("id_document", {
          uri: idFile.uri,
          name: idFile.name || "id_document.jpg",
          type: idFile.mimeType || "image/jpeg",
        });
      }

      const res = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: formData,
      });

      const data = await safeJson(res);

      // ✅ If backend returns invalid json
      if (data?.raw) {
        console.log("❌ REGISTER RESPONSE NOT JSON:", data.raw);
        Alert.alert("Server Error", "Backend returned invalid response");
        setLoading(false);
        return;
      }

      // ❌ Registration Failed
      if (!res.ok) {
        console.log("❌ REGISTER ERROR:", data);

        let message = "Try again";

        if (data?.detail) message = data.detail;
        else if (data?.error) message = data.error;
        else if (typeof data === "object") {
          message = Object.entries(data)
            .map(([key, value]) => {
              if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
              return `${key}: ${value}`;
            })
            .join("\n");
        }

        Alert.alert("Register Failed", message);
        setLoading(false);
        return;
      }

      // ✅ Organizer registration
      if (role === "organizer") {
        Alert.alert(
          "Request Submitted ✅",
          "Thank you! We are reviewing your organizer request.\n\nCome back and login after approval in 1 to 3 days."
        );

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });

        setLoading(false);
        return;
      }

      // ✅ Customer registration
      Alert.alert("Success ✅", "Customer account created successfully!");

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.log("❌ Register error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {/* ROLE SELECT */}
      <View style={styles.roleBox}>
        <Pressable
          style={[styles.roleBtn, role === "customer" && styles.roleActive]}
          onPress={() => setRole("customer")}
        >
          <Text
            style={[
              styles.roleText,
              role === "customer" && { color: "#000" },
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
              role === "organizer" && { color: "#000" },
            ]}
          >
            Organizer
          </Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#666"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#666"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* ORGANIZER EXTRA FIELDS */}
      {role === "organizer" && (
        <>
          <TextInput
            placeholder="Company Name"
            placeholderTextColor="#666"
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
          />

          <TextInput
            placeholder="MoMo Number / Account"
            placeholderTextColor="#666"
            style={styles.input}
            value={momoNumber}
            onChangeText={setMomoNumber}
            keyboardType="phone-pad"
          />

          <Pressable style={styles.uploadBtn} onPress={pickIdDocument}>
            <Ionicons name="cloud-upload-outline" size={22} color="#7CFF00" />
            <Text style={styles.uploadText}>
              {idFile ? "ID Document Selected ✅" : "Upload ID / Passport"}
            </Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.registerBtn} onPress={handleRegister}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.registerText}>
            {role === "organizer" ? "Submit Request" : "Create Account"}
          </Text>
        )}
      </Pressable>

      <Text style={styles.bottomText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Login
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

  registerBtn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 18,
  },

  registerText: {
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

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124,255,0,0.4)",
    marginBottom: 16,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  uploadText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});