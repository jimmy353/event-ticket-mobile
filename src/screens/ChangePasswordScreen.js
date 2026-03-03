import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { apiFetch } from "../services/api";

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access");

      const res = await apiFetch("/api/auth/change-password/", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Password change failed");
        return;
      }

      // 🔐 AUTO LOGOUT
      await AsyncStorage.removeItem("access");
      await AsyncStorage.removeItem("refresh");

      Alert.alert("Success", "Password changed. Please login again.");

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );

    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Network error");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#000000", "#050505", "#0b0b0b"]}
        style={StyleSheet.absoluteFill}
      />

      {/* BACK BUTTON */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#7CFF00" />
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>Change Password</Text>

        {/* CURRENT PASSWORD */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Current Password"
            placeholderTextColor="#666"
            style={styles.input}
            secureTextEntry={!showCurrent}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Pressable onPress={() => setShowCurrent(!showCurrent)}>
            <Ionicons
              name={showCurrent ? "eye-off" : "eye"}
              size={20}
              color="#7CFF00"
            />
          </Pressable>
        </View>

        {/* NEW PASSWORD */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#666"
            style={styles.input}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Pressable onPress={() => setShowNew(!showNew)}>
            <Ionicons
              name={showNew ? "eye-off" : "eye"}
              size={20}
              color="#7CFF00"
            />
          </Pressable>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor="#666"
            style={styles.input}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye-off" : "eye"}
              size={20}
              color="#7CFF00"
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 120,
    paddingHorizontal: 24,
  },

  backButton: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 10,
  },

  title: {
    color: "#7CFF00",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 40,
  },

  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  input: {
    color: "#fff",
    paddingVertical: 14,
    flex: 1,
  },

  button: {
    backgroundColor: "#7CFF00",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});