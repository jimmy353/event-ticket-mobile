import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch } from "../services/api";

export default function MyOrdersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function safeJson(res) {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.log("❌ Orders returned HTML:", text);
      return { error: "Server returned invalid response" };
    }
  }

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/api/orders/my/");
      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to load orders");
        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("❌ Orders fetch error:", err.message);

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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const formatMoney = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("en-US");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toDateString();
  };

  const getStatusColor = (status) => {
    if (status === "paid") return "#7CFF00";
    if (status === "pending") return "#ffaa00";
    if (status === "refunded") return "#00d4ff";
    if (status === "refund_requested") return "#ff00ff";
    return "#aaa";
  };

  // ✅ LOGOUT (FIXED)
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
            await AsyncStorage.removeItem("is_organizer"); // ✅ VERY IMPORTANT

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

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.eventTitle}>{item.event_title || "Event"}</Text>

          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || "UNKNOWN").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.sub}>
          🎟 Ticket:{" "}
          <Text style={styles.bold}>{item.ticket_type_name || "Ticket"}</Text>
        </Text>

        <Text style={styles.sub}>
          🔢 Quantity: <Text style={styles.bold}>{item.quantity || 1}</Text>
        </Text>

        <Text style={styles.sub}>
          📅 Date: <Text style={styles.bold}>{formatDate(item.created_at)}</Text>
        </Text>

        <Text style={styles.amount}>SSP {formatMoney(item.total_amount)}</Text>

        {/* REFUND BUTTON */}
        {item.status === "paid" && (
          <Pressable
            style={styles.refundBtn}
            onPress={() =>
              navigation.navigate("RefundRequest", {
                order: item,
              })
            }
          >
            <Ionicons name="return-down-back" size={18} color="#000" />
            <Text style={styles.refundText}>Request Refund</Text>
          </Pressable>
        )}

        {item.status === "refund_requested" && (
          <Text style={styles.pendingRefund}>
            Refund request already sent. Waiting approval...
          </Text>
        )}

        {item.status === "refunded" && (
          <Text style={styles.refundedText}>Refund completed successfully.</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#aaa", marginTop: 12 }}>
          Loading your orders...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#7CFF00", "#00d4ff", "#ff00ff"]}
        style={styles.header}
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSub}>
            Track purchases & refund requests
          </Text>
        </View>

        {/* RIGHT ICONS */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable style={styles.refreshBtn} onPress={fetchOrders}>
            <Ionicons name="refresh" size={22} color="#000" />
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#000" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* LIST */}
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#000",
    fontSize: 24,
    fontWeight: "bold",
  },

  headerSub: {
    color: "#111",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "600",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyText: {
    color: "#666",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  statusText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  sub: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 13,
  },

  bold: {
    color: "#fff",
    fontWeight: "bold",
  },

  amount: {
    color: "#7CFF00",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 14,
  },

  refundBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 18,
  },

  refundText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 8,
  },

  pendingRefund: {
    color: "#ff00ff",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "bold",
  },

  refundedText: {
    color: "#00d4ff",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
});