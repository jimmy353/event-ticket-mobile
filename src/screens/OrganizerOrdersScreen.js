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
  TextInput,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal for viewing order details
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadEverything();
  }, []);

  async function loadEverything() {
    try {
      setLoading(true);

      await fetchEvents();
      await fetchOrders();
    } catch (err) {
      console.log("❌ Load Everything Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    try {
      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events Error:", data);
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.log("❌ Fetch Events Error:", err);
    }
  }

  async function fetchOrders() {
    try {
      const res = await apiFetch("/api/orders/organizer/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Orders Error:", data);
        Alert.alert("Error", data?.detail || data?.error || "Failed to load orders.");
        return;
      }

      setOrders(data);
    } catch (err) {
      console.log("❌ Fetch Orders Error:", err);
      Alert.alert("Error", "Failed to load organizer orders.");
    }
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await fetchOrders();
    } catch (err) {
      console.log("❌ Refresh Error:", err);
    } finally {
      setRefreshing(false);
    }
  }

  function openOrderDetails(order) {
    setSelectedOrder(order);
    setShowDetails(true);
  }

  function formatDate(dateString) {
    if (!dateString) return "Unknown";
    const d = new Date(dateString);
    return d.toLocaleString();
  }

  function getStatusColor(status) {
    if (status === "paid") return "#7CFF00";
    if (status === "pending") return "#FFB300";
    if (status === "refund_requested") return "#00D4FF";
    if (status === "refunded") return "#FF3B30";
    return "#999";
  }

  // Filter by selected event
  const eventFilteredOrders = selectedEvent
    ? orders.filter((o) => o.event_title === selectedEvent.title)
    : orders;

  // Search filter
  const filteredOrders = eventFilteredOrders.filter((o) => {
    const q = search.toLowerCase();

    return (
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.ticket_type_name || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  // Total stats
  const totalOrders = filteredOrders.length;

  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );

  const totalCommission = filteredOrders.reduce(
    (sum, o) => sum + (o.commission_amount || 0),
    0
  );

  const totalOrganizerAmount = filteredOrders.reduce(
    (sum, o) => sum + (o.organizer_amount || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Orders</Text>

        <View style={{ width: 55 }} />
      </View>

      {/* SELECT EVENT */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventPicker(true)}
      >
        <Text style={styles.selectEventText}>
          Selected Event:{" "}
          <Text style={{ color: "#7CFF00", fontWeight: "bold" }}>
            {selectedEvent ? selectedEvent.title : "All Events"}
          </Text>
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Orders:</Text>
          <Text style={styles.summaryValue}>{totalOrders}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Revenue:</Text>
          <Text style={styles.summaryValue}>SSP {totalRevenue.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Commission:</Text>
          <Text style={[styles.summaryValue, { color: "#FFB300" }]}>
            SSP {totalCommission.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Organizer Earnings:</Text>
          <Text style={[styles.summaryValue, { color: "#7CFF00" }]}>
            SSP {totalOrganizerAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 30 }} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found.</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 50 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openOrderDetails(item)}>
              <View style={styles.topRow}>
                <Text style={styles.orderId}>Order #{item.id}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    { borderColor: getStatusColor(item.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.status) },
                    ]}
                  >
                    {String(item.status).toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventTitle}>{item.event_title}</Text>

              <View style={styles.orderRow}>
                <Text style={styles.label}>Customer:</Text>
                <Text style={styles.value}>{item.customer_email}</Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.label}>Ticket Type:</Text>
                <Text style={styles.value}>{item.ticket_type_name}</Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>{item.quantity}</Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.label}>Total:</Text>
                <Text style={styles.value}>SSP {item.total_amount}</Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.label}>Organizer:</Text>
                <Text style={[styles.value, { color: "#7CFF00" }]}>
                  SSP {item.organizer_amount}
                </Text>
              </View>

              <Text style={styles.createdAt}>
                {formatDate(item.created_at)}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* EVENT PICKER MODAL */}
      <Modal visible={showEventPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable
                style={[
                  styles.eventOption,
                  !selectedEvent && styles.eventOptionActive,
                ]}
                onPress={() => {
                  setSelectedEvent(null);
                  setShowEventPicker(false);
                }}
              >
                <Text style={styles.eventOptionText}>All Events</Text>
              </Pressable>

              {events.map((ev) => (
                <Pressable
                  key={ev.id}
                  style={[
                    styles.eventOption,
                    selectedEvent?.id === ev.id && styles.eventOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedEvent(ev);
                    setShowEventPicker(false);
                  }}
                >
                  <Text style={styles.eventOptionText}>{ev.title}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowEventPicker(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ORDER DETAILS MODAL */}
      <Modal visible={showDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Order Details</Text>

            {selectedOrder && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Order ID: </Text>#{selectedOrder.id}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Event: </Text>
                  {selectedOrder.event_title}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Customer: </Text>
                  {selectedOrder.customer_email}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Ticket Type: </Text>
                  {selectedOrder.ticket_type_name}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Quantity: </Text>
                  {selectedOrder.quantity}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Total Amount: </Text>
                  SSP {selectedOrder.total_amount}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Commission: </Text>
                  SSP {selectedOrder.commission_amount}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Organizer Amount: </Text>
                  SSP {selectedOrder.organizer_amount}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Status: </Text>
                  {selectedOrder.status}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Created At: </Text>
                  {formatDate(selectedOrder.created_at)}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#7CFF00" }]}
              onPress={() => setShowDetails(false)}
            >
              <Text style={[styles.modalBtnText, { color: "#000" }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 18,
  },

  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 20,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  backText: { color: "#7CFF00", fontSize: 18, fontWeight: "bold" },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  selectEventBtn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  selectEventText: { color: "#aaa", fontSize: 14 },

  arrow: { color: "#7CFF00", fontWeight: "bold", fontSize: 14 },

  searchBox: {
    backgroundColor: "#111",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },

  searchIcon: { color: "#666", marginRight: 8 },

  searchInput: { flex: 1, color: "#fff", fontSize: 14 },

  summaryCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 18,
  },

  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  summaryLabel: { color: "#777" },
  summaryValue: { color: "#fff", fontWeight: "bold" },

  emptyText: { color: "#777", textAlign: "center", marginTop: 50 },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderId: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  statusText: { fontWeight: "bold", fontSize: 12 },

  eventTitle: {
    color: "#7CFF00",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },

  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: { color: "#777", fontSize: 14 },
  value: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  createdAt: {
    color: "#666",
    fontSize: 12,
    marginTop: 12,
    textAlign: "right",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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

  eventOptionText: { color: "#fff", fontWeight: "bold" },

  modalBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  detailText: {
    color: "#fff",
    marginBottom: 10,
    fontSize: 14,
  },

  detailLabel: {
    color: "#aaa",
    fontWeight: "bold",
  },
});