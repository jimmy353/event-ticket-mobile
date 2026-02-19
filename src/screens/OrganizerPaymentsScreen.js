import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerPaymentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showEventPicker, setShowEventPicker] = useState(false);

  const [payments, setPayments] = useState([]);

  const [summary, setSummary] = useState({
    total_paid: 0,
    total_commission: 0,
    total_organizer_amount: 0,
    count: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchPayments(selectedEvent.id);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events error:", data);
        Alert.alert("Error", data?.detail || "Failed to load events.");
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
      } else {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.log("❌ Fetch events failed:", err);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(eventId) {
    try {
      setPaymentsLoading(true);

      // ✅ This endpoint must exist in your backend
      const res = await apiFetch(`/api/payments/organizer/?event_id=${eventId}`);
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Payments error:", data);
        Alert.alert("Error", data?.detail || "Failed to load payments.");
        return;
      }

      // Expected response format:
      // {
      //   payments: [],
      //   summary: { total_paid, total_commission, total_organizer_amount, count }
      // }

      setPayments(data.payments || []);

      setSummary({
        total_paid: data?.summary?.total_paid || 0,
        total_commission: data?.summary?.total_commission || 0,
        total_organizer_amount: data?.summary?.total_organizer_amount || 0,
        count: data?.summary?.count || 0,
      });
    } catch (err) {
      console.log("❌ Fetch payments failed:", err);
      Alert.alert("Error", "Failed to load payments.");
    } finally {
      setPaymentsLoading(false);
    }
  }

  function formatMoney(amount) {
    const n = Number(amount || 0);
    return n.toFixed(2);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString();
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await fetchEvents();
      if (selectedEvent?.id) {
        await fetchPayments(selectedEvent.id);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7CFF00" />
        </Pressable>

        <Text style={styles.title}>Payments</Text>

        <Pressable
          style={styles.refreshBtn}
          onPress={() => {
            if (selectedEvent?.id) fetchPayments(selectedEvent.id);
          }}
        >
          <Ionicons name="refresh" size={22} color="#00d4ff" />
        </Pressable>
      </View>

      {/* SELECT EVENT */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventPicker(true)}
      >
        <View>
          <Text style={styles.selectLabel}>Selected Event</Text>
          <Text style={styles.selectValue}>
            {selectedEvent ? selectedEvent.title : "No Event Found"}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={20} color="#7CFF00" />
      </Pressable>

      {/* LOADING EVENTS */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7CFF00" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <>
          {/* SUMMARY BOX */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>
                ${formatMoney(summary.total_paid)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Commission</Text>
              <Text style={[styles.summaryValue, { color: "#ff4444" }]}>
                ${formatMoney(summary.total_commission)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Organizer Earnings</Text>
              <Text style={[styles.summaryValue, { color: "#7CFF00" }]}>
                ${formatMoney(summary.total_organizer_amount)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payments Count</Text>
              <Text style={styles.summaryValue}>{summary.count}</Text>
            </View>
          </View>

          {/* PAYMENTS LIST */}
          {paymentsLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7CFF00" />
              <Text style={styles.loadingText}>Loading payments...</Text>
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="wallet-outline" size={60} color="#333" />
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptyText}>
                No payment has been made for this event.
              </Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <View style={styles.paymentCard}>
                  <View style={styles.paymentTop}>
                    <Text style={styles.paymentUser}>
                      {item?.buyer_name || "Unknown Buyer"}
                    </Text>

                    <Text
                      style={[
                        styles.statusBadge,
                        item.status === "paid"
                          ? styles.statusPaid
                          : styles.statusPending,
                      ]}
                    >
                      {item.status?.toUpperCase() || "UNKNOWN"}
                    </Text>
                  </View>

                  <Text style={styles.paymentSmall}>
                    Amount:{" "}
                    <Text style={styles.paymentBold}>
                      ${formatMoney(item.amount)}
                    </Text>
                  </Text>

                  <Text style={styles.paymentSmall}>
                    Commission:{" "}
                    <Text style={{ color: "#ff4444", fontWeight: "bold" }}>
                      ${formatMoney(item.commission_amount)}
                    </Text>
                  </Text>

                  <Text style={styles.paymentSmall}>
                    Organizer:{" "}
                    <Text style={{ color: "#7CFF00", fontWeight: "bold" }}>
                      ${formatMoney(item.organizer_amount)}
                    </Text>
                  </Text>

                  <Text style={styles.paymentDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* EVENT PICKER MODAL */}
      <Modal visible={showEventPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            {events.length === 0 ? (
              <Text style={styles.emptyText}>No events available.</Text>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.eventOption,
                      selectedEvent?.id === item.id && styles.eventOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedEvent(item);
                      setShowEventPicker(false);
                    }}
                  >
                    <Text style={styles.eventOptionText}>{item.title}</Text>
                    <Text style={styles.eventOptionSmall}>
                      {item.location || "No Location"}
                    </Text>
                  </Pressable>
                )}
              />
            )}

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowEventPicker(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  selectEventBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  selectLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },

  selectValue: {
    color: "#7CFF00",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 14,
  },

  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    color: "#aaa",
    fontSize: 13,
  },

  summaryValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 120,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 25,
    lineHeight: 18,
  },

  paymentCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  paymentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  paymentUser: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    fontSize: 11,
    fontWeight: "bold",
  },

  statusPaid: {
    backgroundColor: "#7CFF00",
    color: "#000",
  },

  statusPending: {
    backgroundColor: "#ff4444",
    color: "#fff",
  },

  paymentSmall: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 6,
  },

  paymentBold: {
    color: "#fff",
    fontWeight: "bold",
  },

  paymentDate: {
    marginTop: 10,
    color: "#666",
    fontSize: 11,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
    maxHeight: "85%",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  eventOption: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 10,
  },

  eventOptionActive: {
    borderColor: "#7CFF00",
  },

  eventOptionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  eventOptionSmall: {
    color: "#777",
    marginTop: 4,
    fontSize: 12,
  },

  modalBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
