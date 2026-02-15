import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  // ✅ Format money
  const formatMoney = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("en-US");
  };

  // ✅ Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  async function fetchPayments() {
    try {
      setLoading(true);

      // ✅ IMPORTANT: backend must have this endpoint
      const res = await apiFetch("/api/payments/organizer/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Organizer payments error:", data);
        Alert.alert("Error", data?.error || "Failed to load payments.");
        return;
      }

      setPayments(data);
    } catch (err) {
      console.log("❌ Fetch payments failed:", err);
      Alert.alert("Error", "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  function openPayment(payment) {
    setSelectedPayment(payment);
    setShowDetails(true);
  }

  function getStatusColor(status) {
    if (!status) return "#aaa";

    if (status === "success") return "#7CFF00";
    if (status === "pending") return "#ffcc00";
    if (status === "failed") return "#ff4d4d";
    if (status === "refunded") return "#00d4ff";

    return "#aaa";
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7CFF00" />
        </Pressable>

        <Text style={styles.headerTitle}>Payments</Text>

        <Pressable style={styles.iconBtn} onPress={fetchPayments}>
          <Ionicons name="refresh" size={22} color="#7CFF00" />
        </Pressable>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 40 }} />
      ) : payments.length === 0 ? (
        <Text style={styles.emptyText}>No payments found yet.</Text>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openPayment(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.paymentId}>PAY-{item.id}</Text>

                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {String(item.status).toUpperCase()}
                </Text>
              </View>

              <Text style={styles.amount}>
                SSP {formatMoney(item.amount)}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Provider:</Text>
                <Text style={styles.value}>{item.provider}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{item.phone}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Event:</Text>
                <Text style={styles.value}>{item.event_title || "N/A"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Customer:</Text>
                <Text style={styles.value}>{item.customer_email || "N/A"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={styles.tapHint}>Tap to view details</Text>
            </Pressable>
          )}
        />
      )}

      {/* DETAILS MODAL */}
      <Modal visible={showDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Details</Text>

                <Pressable onPress={() => setShowDetails(false)}>
                  <Ionicons name="close" size={26} color="#fff" />
                </Pressable>
              </View>

              {selectedPayment && (
                <>
                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Payment ID:</Text> PAY-{selectedPayment.id}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Status:</Text>{" "}
                    <Text style={{ color: getStatusColor(selectedPayment.status) }}>
                      {selectedPayment.status}
                    </Text>
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Amount:</Text> SSP{" "}
                    {formatMoney(selectedPayment.amount)}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Provider:</Text> {selectedPayment.provider}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Phone:</Text> {selectedPayment.phone}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Order ID:</Text>{" "}
                    {selectedPayment.order_id || "N/A"}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Event:</Text>{" "}
                    {selectedPayment.event_title || "N/A"}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Customer:</Text>{" "}
                    {selectedPayment.customer_email || "N/A"}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.bold}>Created:</Text>{" "}
                    {formatDate(selectedPayment.created_at)}
                  </Text>
                </>
              )}

              <Pressable
                style={styles.closeBtn}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 80,
    fontSize: 14,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  paymentId: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "bold",
  },

  status: {
    fontSize: 13,
    fontWeight: "bold",
  },

  amount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    color: "#777",
    fontSize: 13,
  },

  value: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    maxWidth: "65%",
    textAlign: "right",
  },

  tapHint: {
    color: "#7CFF00",
    fontSize: 12,
    marginTop: 12,
    textAlign: "right",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
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

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  modalText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10,
  },

  bold: {
    color: "#fff",
    fontWeight: "bold",
  },

  closeBtn: {
    backgroundColor: "#7CFF00",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 20,
  },

  closeText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});