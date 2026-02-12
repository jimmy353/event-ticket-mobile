import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { apiFetch, API_URL } from "../services/api";

export default function OrganizerRefundsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  async function safeJson(res) {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.log("❌ Refunds returned HTML:", text);
      return { error: "Server returned invalid response" };
    }
  }

  const fetchRefunds = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/api/refunds/organizer/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Refund fetch error:", data);
        Alert.alert("Error", data.error || "Failed to load refunds");
        setRefunds([]);
        setLoading(false);
        return;
      }

      setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("❌ Refunds fetch exception:", err.message);

      if (err.message.includes("Session expired")) {
        navigation.replace("Login");
      } else {
        Alert.alert("Error", err.message);
      }
    }

    setLoading(false);
  };

  const approveRefund = async (refundId) => {
    setProcessingId(refundId);

    try {
      const res = await apiFetch(`/api/refunds/${refundId}/approve/`, {
        method: "POST",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to approve refund");
        setProcessingId(null);
        return;
      }

      Alert.alert("Success", "Refund approved successfully!");
      fetchRefunds();
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setProcessingId(null);
  };

  const rejectRefund = async (refundId) => {
    setProcessingId(refundId);

    try {
      const res = await apiFetch(`/api/refunds/${refundId}/reject/`, {
        method: "POST",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to reject refund");
        setProcessingId(null);
        return;
      }

      Alert.alert("Rejected", "Refund request rejected.");
      fetchRefunds();
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setProcessingId(null);
  };

  const getStatusStyle = (status) => {
    if (status === "approved") return styles.badgeApproved;
    if (status === "rejected") return styles.badgeRejected;
    return styles.badgePending;
  };

  const getStatusTextStyle = (status) => {
    if (status === "approved") return styles.badgeTextApproved;
    if (status === "rejected") return styles.badgeTextRejected;
    return styles.badgeTextPending;
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#aaa", marginTop: 12 }}>
          Loading Refund Requests...
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
          <Text style={styles.headerTitle}>Refund Requests</Text>
          <Text style={styles.headerSub}>
            Manage customer refund requests
          </Text>
        </View>

        <Pressable style={styles.refreshBtn} onPress={fetchRefunds}>
          <Ionicons name="refresh" size={22} color="#000" />
        </Pressable>
      </LinearGradient>

      {/* ================= EMPTY ================= */}
      {refunds.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={50} color="#666" />
          <Text style={styles.emptyText}>No refund requests found</Text>
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* TOP ROW */}
              <View style={styles.topRow}>
                <Text style={styles.eventTitle}>{item.event_title}</Text>

                <View style={[styles.badge, getStatusStyle(item.status)]}>
                  <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.ticketType}>
                🎟 Ticket: {item.ticket_type}
              </Text>

              <Text style={styles.amount}>
                SSP {formatMoney(item.amount)}
              </Text>

              <Text style={styles.meta}>
                👤 {item.customer_email}
              </Text>

              <Text style={styles.meta}>
                📅 Requested: {formatDate(item.created_at)}
              </Text>

              {item.reason ? (
                <Text style={styles.reason}>
                  📝 {item.reason}
                </Text>
              ) : null}

              {/* ACTIONS */}
              {item.status === "pending" && (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() =>
                      Alert.alert(
                        "Reject Refund",
                        "Are you sure you want to reject this refund?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Reject", style: "destructive", onPress: () => rejectRefund(item.id) },
                        ]
                      )
                    }
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.rejectText}>Reject</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.approveBtn}
                    onPress={() =>
                      Alert.alert(
                        "Approve Refund",
                        "This will cancel tickets and restore stock. Continue?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Approve", onPress: () => approveRefund(item.id) },
                        ]
                      )
                    }
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.approveText}>Approve</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
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

  badgePending: {
    backgroundColor: "rgba(255,170,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,170,0,0.5)",
  },

  badgeApproved: {
    backgroundColor: "rgba(124,255,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,255,0,0.5)",
  },

  badgeRejected: {
    backgroundColor: "rgba(255,0,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.5)",
  },

  badgeTextPending: { color: "#ffaa00" },
  badgeTextApproved: { color: "#7CFF00" },
  badgeTextRejected: { color: "#ff4d4d" },

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

  reason: {
    color: "#ccc",
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#ff4d4d",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  rejectText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  approveBtn: {
    flex: 1,
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  approveText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },
});