import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, safeJson } from "../services/api";

export default function OrganizerPaymentsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPayments(selectedEvent.id);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (res.ok) {
        setEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.log("Events error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(eventId) {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/payments/organizer/?event=${eventId}`);
      const data = await safeJson(res);

      if (res.ok) setPayments(data);
      else Alert.alert("Error", data?.error || "Failed to load payments.");
    } catch (err) {
      console.log("Payments error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function requestWithdrawal() {
    if (!selectedEvent) return;

    try {
      const res = await apiFetch("/api/payouts/request/", {
        method: "POST",
        body: JSON.stringify({ event_id: selectedEvent.id }),
      });

      const data = await safeJson(res);

      if (res.ok) {
        Alert.alert("Success", `Withdrawal requested\nTotal: SSP ${data.total}`);
      } else {
        Alert.alert("Error", data?.error || "Failed to request withdrawal.");
      }
    } catch (err) {
      console.log("Withdrawal error:", err);
    }
  }

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
  const totalOrganizer = payments.reduce(
    (sum, p) => sum + p.organizer_amount,
    0
  );

  function payoutColor(status) {
    return status === "paid" ? "#7CFF00" : "#ffcc00";
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7CFF00" />
        </Pressable>

        <Text style={styles.title}>Organizer Payments</Text>

        <Pressable onPress={() => fetchPayments(selectedEvent?.id)}>
          <Ionicons name="refresh" size={22} color="#00d4ff" />
        </Pressable>
      </View>

      {/* EVENT SELECTOR */}
      <Pressable
        style={styles.eventSelector}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.eventText}>
          {selectedEvent ? selectedEvent.title : "Select Event"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#7CFF00" />
      </Pressable>

      {/* SUMMARY */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Revenue Summary</Text>
        <Text style={styles.summaryWhite}>
          Total Revenue: SSP {totalRevenue.toFixed(2)}
        </Text>
        <Text style={styles.summaryRed}>
          Commission: SSP {totalCommission.toFixed(2)}
        </Text>
        <Text style={styles.summaryGreen}>
          Organizer Earnings: SSP {totalOrganizer.toFixed(2)}
        </Text>
      </View>

      {/* WITHDRAW BUTTON */}
      <Pressable style={styles.withdrawBtn} onPress={requestWithdrawal}>
        <Text style={styles.withdrawText}>Request Withdrawal</Text>
      </Pressable>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.amount}>SSP {item.amount}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Provider</Text>
                <Text style={styles.value}>
                  {item.provider.toUpperCase()}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>
                  {item.customer_email}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Ticket</Text>
                <Text style={styles.value}>
                  {item.ticket_type_name}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Payout</Text>
                <Text
                  style={[
                    styles.value,
                    { color: payoutColor(item.payout_status) },
                  ]}
                >
                  {item.payout_status?.toUpperCase() || "UNPAID"}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* EVENT MODAL */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.eventOption}
                  onPress={() => {
                    setSelectedEvent(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={{ color: "#fff" }}>{item.title}</Text>
                </Pressable>
              )}
            />

            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowPicker(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 55,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  eventSelector: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  eventText: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  summaryBox: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },

  summaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  summaryWhite: { color: "#fff", marginBottom: 4 },
  summaryRed: { color: "#FF3B30", marginBottom: 4 },
  summaryGreen: { color: "#7CFF00", fontWeight: "bold" },

  withdrawBtn: {
    backgroundColor: "#7CFF00",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },

  withdrawText: {
    color: "#000",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },

  amount: {
    color: "#7CFF00",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: { color: "#777" },
  value: { color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  eventOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  closeBtn: {
    marginTop: 20,
    alignItems: "center",
  },
});