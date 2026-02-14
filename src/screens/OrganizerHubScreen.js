import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch } from "../services/api";

export default function OrganizerHubScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState({
    total_events: 0,
    total_orders: 0,
    total_sales: 0,
    organizer_balance: 0,
    pending_payouts: 0,
    paid_payouts: 0,
    platform_commission: 0,
  });

  const [organizer, setOrganizer] = useState({
    name: "Organizer",
    logo: null,
    email: "",
  });

  useEffect(() => {
    fetchDashboard();
    fetchOrganizerProfile();
  }, []);

  // ✅ Format numbers with commas
  const formatMoney = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("en-US");
  };

  // ✅ Safe JSON reader
  async function safeJson(res) {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.log("❌ Organizer hub returned HTML:", text);
      return { error: "Server returned invalid response" };
    }
  }

  async function fetchDashboard() {
    setLoading(true);

    try {
      const res = await apiFetch("/api/organizer/dashboard/");
      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to load dashboard");
        setLoading(false);
        return;
      }

      setDashboard(data);
    } catch (err) {
      if (err.message.includes("Session expired")) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else {
        Alert.alert("Error", err.message);
      }
    }

    setLoading(false);
  }

  async function fetchOrganizerProfile() {
    try {
      const res = await apiFetch("/api/auth/profile/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Profile fetch error:", data);
        return;
      }

      setOrganizer({
        name: data?.full_name || data?.name || "Organizer",
        logo: data?.logo || data?.profile_image || null,
        email: data?.email || "",
      });
    } catch (err) {
      console.log("❌ Organizer profile fetch error:", err.message);
    }
  }

  // ✅ LOGOUT
  const handleLogout = async () => {
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("access");
            await AsyncStorage.removeItem("refresh");
            await AsyncStorage.removeItem("is_organizer");

            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (err) {
            Alert.alert("Error", "Logout failed");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#aaa", marginTop: 12 }}>
          Loading Organizer Hub...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.small}>Organizer Hub</Text>
          <Text style={styles.big}>Manage Your Business</Text>

          <View style={styles.organizerRow}>
            {organizer.logo ? (
              <Image source={{ uri: organizer.logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="person" size={18} color="#000" />
              </View>
            )}

            <View>
              <Text style={styles.organizerName}>{organizer.name}</Text>
              <Text style={styles.organizerEmail}>{organizer.email}</Text>
            </View>
          </View>
        </View>

        {/* RIGHT ICONS */}
        <View style={styles.rightIcons}>
          <Pressable style={styles.iconBtn} onPress={fetchDashboard}>
            <Ionicons name="refresh" size={22} color="#7CFF00" />
          </Pressable>

          <Pressable style={styles.iconBtnLogout} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
          </Pressable>
        </View>
      </View>

      {/* BALANCE CARD */}
      <LinearGradient
        colors={["#7CFF00", "#2dffb3", "#00d4ff"]}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceTitle}>Organizer Wallet</Text>
        <Text style={styles.balanceAmount}>
          SSP {formatMoney(dashboard.organizer_balance)}
        </Text>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Pending Payouts</Text>
            <Text style={styles.balanceValue}>
              SSP {formatMoney(dashboard.pending_payouts)}
            </Text>
          </View>

          <View>
            <Text style={styles.balanceLabel}>Paid Payouts</Text>
            <Text style={styles.balanceValue}>
              SSP {formatMoney(dashboard.paid_payouts)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* STATS GRID */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={26} color="#7CFF00" />
          <Text style={styles.statNumber}>{dashboard.total_events}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cart" size={26} color="#00d4ff" />
          <Text style={styles.statNumber}>{dashboard.total_orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={26} color="#ffcc00" />
          <Text style={styles.statNumber}>
            SSP {formatMoney(dashboard.total_sales)}
          </Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="pie-chart" size={26} color="#ff00ff" />
          <Text style={styles.statNumber}>
            SSP{" "}
            {formatMoney(
              Number(dashboard.total_sales || 0) -
                Number(dashboard.organizer_balance || 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Platform Commission</Text>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerEvents")}
      >
        <Ionicons name="calendar" size={24} color="#7CFF00" />
        <Text style={styles.actionText}>Events</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerTickets")}
      >
        <Ionicons name="ticket" size={24} color="#7CFF00" />
        <Text style={styles.actionText}>Tickets</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerOrders")}
      >
        <Ionicons name="receipt" size={24} color="#00d4ff" />
        <Text style={styles.actionText}>Orders</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerPayments")}
      >
        <Ionicons name="card" size={24} color="#ffcc00" />
        <Text style={styles.actionText}>Payments</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerPayouts")}
      >
        <Ionicons name="swap-horizontal" size={24} color="#ffcc00" />
        <Text style={styles.actionText}>Payouts</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerRefunds")}
      >
        <Ionicons name="return-down-back" size={24} color="#ff4d4d" />
        <Text style={styles.actionText}>Refunds</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerWallets")}
      >
        <Ionicons name="wallet" size={24} color="#7CFF00" />
        <Text style={styles.actionText}>Wallets</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => navigation.navigate("OrganizerMyAccount")}
      >
        <Ionicons name="person-circle" size={26} color="#ff00ff" />
        <Text style={styles.actionText}>My Account</Text>
      </Pressable>

      {/* FOOTER */}
      <Text style={styles.footer}>
        Organizer Hub is secured. Only verified organizers can access it.
      </Text>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingTop: 60,
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },

  small: {
    color: "#aaa",
    fontSize: 14,
  },

  big: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 3,
  },

  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },

  organizerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  organizerEmail: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  logoPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
  },

  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  iconBtnLogout: {
    width: 46,
    height: 46,
    borderRadius: 20,
    backgroundColor: "rgba(255, 77, 77, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.6)",
  },

  balanceCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },

  balanceTitle: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },

  balanceAmount: {
    color: "#000",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  balanceLabel: {
    color: "#111",
    fontWeight: "700",
    fontSize: 12,
  },

  balanceValue: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
  },

  statLabel: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 14,
  },

  footer: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 20,
  },
});