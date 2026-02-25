import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { apiFetch, safeJson } from "../services/api";

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

/**
 * Refund allowed anytime UNTIL 24 hours before event
 */
function canRequestRefund(eventStartDate) {
  if (!eventStartDate) return false;

  const eventStart = new Date(eventStartDate).getTime();
  const now = Date.now();

  const cutoff = eventStart - 24 * 60 * 60 * 1000;

  return now < cutoff;
}

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders/my/");
      const data = await safeJson(res);

      if (!res.ok) {
        Alert.alert("Error", data?.detail || data?.error || "Failed to load orders");
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("❌ fetchOrders:", e);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await fetchOrders();
    } finally {
      setRefreshing(false);
    }
  }

  async function requestRefund(order) {
    if (!order?.id) return;

    if (order.status !== "paid") {
      Alert.alert("Not allowed", "Only paid orders can be refunded.");
      return;
    }

    if (!canRequestRefund(order.event_start_date)) {
      Alert.alert(
        "Refund closed",
        "Refund is only accepted until 24 hours before the event."
      );
      return;
    }

    Alert.alert(
      "Request Refund",
      "Refund may take 3 to 7 days to be processed in MoMo.\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Request",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch("/api/refunds/request/", {
                method: "POST",
                body: JSON.stringify({ order_id: order.id }),
              });

              const data = await safeJson(res);

              if (!res.ok) {
                Alert.alert(
                  "Error",
                  data?.error || data?.detail || "Refund request failed"
                );
                return;
              }

              Alert.alert("Submitted", "Refund requested successfully.");
              fetchOrders();
            } catch (e) {
              console.log("❌ requestRefund:", e);
              Alert.alert("Error", "Refund request failed.");
            }
          },
        },
      ]
    );
  }

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [orders]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={sortedOrders}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const refundAllowed =
              item.status === "paid" &&
              canRequestRefund(item.event_start_date);

            const refundRequested =
              item.status === "refund_requested" ||
              item.status === "refunded";

            return (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>
                  {item.event_title || "Event"}
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.label}>Ticket: </Text>
                  <Text style={styles.value}>
                    {item.ticket_type_name || "-"}
                  </Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.label}>Qty: </Text>
                  <Text style={styles.value}>{item.quantity}</Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.label}>Total: </Text>
                  <Text style={styles.value}>
                    SSP {money(item.total_amount)}
                  </Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.label}>Status: </Text>
                  <Text
                    style={[
                      styles.value,
                      item.status === "paid"
                        ? styles.paid
                        : item.status === "refund_requested"
                        ? styles.processing
                        : item.status === "refunded"
                        ? styles.refunded
                        : styles.pending,
                    ]}
                  >
                    {String(item.status || "").toUpperCase()}
                  </Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.label}>Date: </Text>
                  <Text style={styles.value}>
                    {formatDate(item.created_at)}
                  </Text>
                </Text>

                {/* REFUND BUTTON */}
                {!refundRequested ? (
                  <Pressable
                    onPress={() => requestRefund(item)}
                    disabled={!refundAllowed}
                    style={[
                      styles.refundBtn,
                      !refundAllowed && { opacity: 0.4 },
                    ]}
                  >
                    <Text style={styles.refundText}>
                      {refundAllowed
                        ? "Request Refund"
                        : "Refund Not Available"}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.statusBox}>
                    <Text style={styles.statusText}>
                      {item.status === "refund_requested"
                        ? "Refund Requested"
                        : "Refund Completed"}
                    </Text>
                  </View>
                )}

                {!refundAllowed && item.status === "paid" && (
                  <Text style={styles.hint}>
                    Refund allowed until 24 hours before event.
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16 },
  header: { marginTop: 18, marginBottom: 18 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },

  eventTitle: {
    color: "#7CFF00",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },

  row: { marginBottom: 6 },
  label: { color: "#777" },
  value: { color: "#fff", fontWeight: "bold" },

  paid: { color: "#7CFF00" },
  pending: { color: "#FFD60A" },
  processing: { color: "#FFA500" },
  refunded: { color: "#00BFFF" },

  refundBtn: {
    marginTop: 12,
    backgroundColor: "#FFD60A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  refundText: { color: "#000", fontWeight: "bold" },

  statusBox: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#333",
    alignItems: "center",
  },

  statusText: { color: "#fff", fontWeight: "bold" },

  hint: { marginTop: 10, color: "#777", fontSize: 12 },
});