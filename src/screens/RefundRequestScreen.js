import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { apiFetch, API_URL } from "../services/api";

export default function RefundRequestScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyOrders();
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

  const fetchMyOrders = async () => {
    setLoading(true);

    try {
      // ✅ this endpoint must return orders of logged-in user
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
      console.log("❌ Fetch orders error:", err.message);

      if (err.message.includes("Session expired")) {
        navigation.replace("Login");
      } else {
        Alert.alert("Error", err.message);
      }
    }

    setLoading(false);
  };

  const openRefundModal = (order) => {
    setSelectedOrder(order);
    setReason("");
    setModalVisible(true);
  };

  const submitRefund = async () => {
    if (!selectedOrder) return;

    if (!reason.trim()) {
      Alert.alert("Error", "Please enter refund reason");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch("/api/refunds/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          reason: reason,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Refund request failed");
        setSubmitting(false);
        return;
      }

      Alert.alert("Success", "Refund request submitted successfully!");
      setModalVisible(false);
      fetchMyOrders();
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setSubmitting(false);
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

  const getStatusStyle = (status) => {
    if (status === "paid") return styles.badgePaid;
    if (status === "pending") return styles.badgePending;
    return styles.badgeDefault;
  };

  const getStatusTextStyle = (status) => {
    if (status === "paid") return styles.badgeTextPaid;
    if (status === "pending") return styles.badgeTextPending;
    return styles.badgeTextDefault;
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
      {/* ================= HEADER ================= */}
      <LinearGradient
        colors={["#7CFF00", "#00d4ff", "#ff00ff"]}
        style={styles.header}
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Request Refund</Text>
          <Text style={styles.headerSub}>Choose an order and submit reason</Text>
        </View>

        <Pressable style={styles.refreshBtn} onPress={fetchMyOrders}>
          <Ionicons name="refresh" size={22} color="#000" />
        </Pressable>
      </LinearGradient>

      {/* ================= EMPTY ================= */}
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={50} color="#666" />
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.eventTitle}>
                  {item.event_title || "Event"}
                </Text>

                <View style={[styles.badge, getStatusStyle(item.status)]}>
                  <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.ticketType}>
                🎟 {item.ticket_type_name || "Ticket"}
              </Text>

              <Text style={styles.amount}>
                SSP {formatMoney(item.total_amount)}
              </Text>

              <Text style={styles.meta}>📅 {formatDate(item.created_at)}</Text>

              {/* Refund Button */}
              {item.status === "paid" ? (
                <Pressable
                  style={styles.refundBtn}
                  onPress={() => openRefundModal(item)}
                >
                  <Ionicons name="return-down-back" size={18} color="#000" />
                  <Text style={styles.refundText}>Request Refund</Text>
                </Pressable>
              ) : (
                <Text style={styles.notAllowed}>
                  Refund allowed only after payment
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* ================= MODAL ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Refund Request</Text>

            <Text style={styles.modalSub}>
              Order #{selectedOrder?.id}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Write reason for refund..."
              placeholderTextColor="#777"
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.submitBtn}
                onPress={submitRefund}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  headerTitle: {
    color: "#000",
    fontSize: 22,
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
    fontSize: 14,
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

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eventTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  badgePaid: {
    backgroundColor: "rgba(124,255,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,255,0,0.5)",
  },

  badgePending: {
    backgroundColor: "rgba(255,170,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,170,0,0.5)",
  },

  badgeDefault: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  badgeTextPaid: { color: "#7CFF00" },
  badgeTextPending: { color: "#ffaa00" },
  badgeTextDefault: { color: "#aaa" },

  ticketType: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 13,
  },

  amount: {
    color: "#7CFF00",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  meta: {
    color: "#777",
    marginTop: 6,
    fontSize: 12,
  },

  refundBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
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

  notAllowed: {
    color: "#666",
    marginTop: 14,
    fontSize: 12,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  modalBox: {
    width: "100%",
    backgroundColor: "#0f0f0f",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  modalSub: {
    color: "#aaa",
    marginTop: 6,
    fontSize: 13,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    height: 120,
    color: "#fff",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  submitBtn: {
    flex: 1,
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  submitText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },
});