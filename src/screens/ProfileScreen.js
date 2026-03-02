import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../services/api";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("access");

      const res = await apiFetch("/api/auth/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        setEmail(data.email);
      }
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  const updateEmail = async () => {
    if (!email) {
      Alert.alert("Error", "Email cannot be empty");
      return;
    }

    setSaving(true);

    const token = await AsyncStorage.getItem("access");

    const res = await apiFetch("/api/auth/profile/", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      Alert.alert("Error", data.error || "Update failed");
      return;
    }

    Alert.alert("Success", "Email updated successfully");
    loadProfile();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7CFF00" />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient
        colors={["#000000", "#050505", "#0b0b0b"]}
        style={StyleSheet.absoluteFill}
      />

      {/* BACK BUTTON */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#7CFF00" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.email?.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile?.is_verified ? "Verified Member" : "Unverified"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <Text style={styles.inputLabel}>Email</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <Pressable style={styles.updateButton} onPress={updateEmail}>
            {saving ? (
              <ActivityIndicator color="#7CFF00" />
            ) : (
              <Text style={styles.updateText}>Save Changes</Text>
            )}
          </Pressable>

          <InfoRow
            label="Status"
            value={profile?.is_verified ? "Active" : "Pending Verification"}
          />
          <InfoRow label="Role" value="Customer" />
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <Text style={styles.actionText}>Change Password</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },

  loader: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },

  headerCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 40,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
  },

  badge: {
    backgroundColor: "#7CFF00",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    color: "#000",
    fontWeight: "bold",
  },

  section: {
    marginBottom: 40,
  },

  sectionTitle: {
    color: "#7CFF00",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },

  inputLabel: {
    color: "#888",
    marginBottom: 8,
  },

  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },

  emailInput: {
    color: "#fff",
    fontSize: 15,
    paddingVertical: 12,
  },

  updateButton: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },

  updateText: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  rowLabel: {
    color: "#888",
  },

  rowValue: {
    color: "#fff",
  },

  actionButton: {
    backgroundColor: "#7CFF00",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  actionText: {
    color: "#000",
    fontWeight: "bold",
  },
});