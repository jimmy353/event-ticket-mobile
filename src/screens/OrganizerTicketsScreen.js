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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  // Event Picker Modal
  const [showEventPicker, setShowEventPicker] = useState(false);

  // Edit Modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [saving, setSaving] = useState(false);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createTotal, setCreateTotal] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // ===============================
  // FETCH EVENTS
  // ===============================
  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events fetch error:", data);
        Alert.alert("Error", data?.detail || data?.error || "Failed to load events.");
        setLoading(false);
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
        fetchTickets(data[0].id);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.log("❌ Fetch events crash:", err);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // FETCH TICKETS FOR EVENT
  // ===============================
  async function fetchTickets(eventId) {
    try {
      setLoading(true);

      const res = await apiFetch(`/api/tickets/?event=${eventId}`);
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Tickets fetch error:", data);
        Alert.alert("Error", data?.detail || data?.error || "Failed to load tickets.");
        return;
      }

      setTickets(data);
    } catch (err) {
      console.log("❌ Fetch tickets crash:", err);
      Alert.alert("Error", "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // REFRESH
  // ===============================
  async function refreshAll() {
    if (!selectedEvent) return;

    try {
      setRefreshing(true);
      await fetchTickets(selectedEvent.id);
    } catch (err) {
      console.log("❌ Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }

  // ===============================
  // OPEN EDIT MODAL
  // ===============================
  function openEdit(ticket) {
    setEditingTicket(ticket);
    setEditName(ticket.name || "");
    setEditPrice(ticket.price ? String(ticket.price) : "");
    setEditTotal(ticket.quantity_total ? String(ticket.quantity_total) : "");
    setShowEdit(true);
  }

  // ===============================
  // UPDATE TICKET TYPE
  // ===============================
  async function updateTicket() {
    if (!editingTicket) return;

    if (!editName || !editPrice || !editTotal) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    if (!selectedEvent) {
      Alert.alert("Error", "Please select an event first.");
      return;
    }

    try {
      setSaving(true);

      const body = {
        name: editName.trim(),
        price: editPrice,
        quantity_total: editTotal,
      };

      // ✅ Correct endpoint (backend must support this)
      const res = await apiFetch(
        `/api/tickets/type/${editingTicket.id}/update/`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update ticket error:", data);
        Alert.alert(
          "Error",
          data?.detail ||
            data?.error ||
            "Ticket update failed. Check backend endpoint."
        );
        return;
      }

      Alert.alert("Success", "Ticket updated successfully!");
      setShowEdit(false);
      setEditingTicket(null);

      fetchTickets(selectedEvent.id);
    } catch (err) {
      console.log("❌ Update ticket crash:", err);
      Alert.alert("Error", "Ticket update failed.");
    } finally {
      setSaving(false);
    }
  }

  // ===============================
  // DELETE TICKET TYPE
  // ===============================
  function deleteTicket(ticketId) {
    Alert.alert("Delete Ticket", "Are you sure you want to delete this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!selectedEvent) return;

          try {
            const res = await apiFetch(
              `/api/tickets/type/${ticketId}/delete/`,
              {
                method: "DELETE",
              }
            );

            const data = await safeJson(res);

            if (!res.ok) {
              console.log("❌ Delete ticket error:", data);
              Alert.alert(
                "Error",
                data?.detail || data?.error || "Failed to delete ticket."
              );
              return;
            }

            Alert.alert("Deleted", "Ticket deleted successfully!");
            fetchTickets(selectedEvent.id);
          } catch (err) {
            console.log("❌ Delete ticket crash:", err);
            Alert.alert("Error", "Failed to delete ticket.");
          }
        },
      },
    ]);
  }

  // ===============================
  // CREATE TICKET TYPE
  // ===============================
  async function createTicketType() {
    if (!selectedEvent) {
      Alert.alert("Error", "Select an event first.");
      return;
    }

    if (!createName || !createPrice || !createTotal) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    try {
      setCreating(true);

      const body = {
        event: selectedEvent.id,
        name: createName.trim(),
        price: createPrice,
        quantity_total: createTotal,
      };

      // ✅ correct endpoint from your backend
      const res = await apiFetch("/api/tickets/type/create/", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Create ticket error:", data);
        Alert.alert(
          "Error",
          data?.detail || data?.error || "Failed to create ticket type."
        );
        return;
      }

      Alert.alert("Success", "Ticket type created!");
      setShowCreate(false);

      setCreateName("");
      setCreatePrice("");
      setCreateTotal("");

      fetchTickets(selectedEvent.id);
    } catch (err) {
      console.log("❌ Create ticket crash:", err);
      Alert.alert("Error", "Failed to create ticket type.");
    } finally {
      setCreating(false);
    }
  }

  // ===============================
  // FILTER
  // ===============================
  const filteredTickets = tickets.filter((t) =>
    (t.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // ===============================
  // UI
  // ===============================
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Tickets</Text>

        <Pressable style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>

      {/* SELECT EVENT BUTTON */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventPicker(true)}
      >
        <Text style={styles.selectEventText}>
          Selected Event:{" "}
          <Text style={styles.selectedEventTitle}>
            {selectedEvent ? selectedEvent.title : "None"}
          </Text>
        </Text>

        <Text style={styles.arrow}>▼</Text>
      </Pressable>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search ticket types..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 30 }} />
      ) : filteredTickets.length === 0 ? (
        <Text style={styles.emptyText}>No ticket types found.</Text>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshing={refreshing}
          onRefresh={refreshAll}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.ticketName}>{item.name}</Text>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.value}>SSP {item.price}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Quantity Total:</Text>
                <Text style={styles.value}>{item.quantity_total}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Quantity Sold:</Text>
                <Text style={[styles.value, { color: "#FF3B30" }]}>
                  {item.quantity_sold}
                </Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Available:</Text>
                <Text style={[styles.value, { color: "#7CFF00" }]}>
                  {item.available}
                </Text>
              </View>

              <View style={styles.btnRow}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => deleteTicket(item.id)}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* ==========================
          EVENT PICKER MODAL
      ========================== */}
      <Modal visible={showEventPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.eventOption,
                    selectedEvent?.id === item.id && styles.eventOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedEvent(item);
                    setShowEventPicker(false);
                    fetchTickets(item.id);
                  }}
                >
                  <Text style={styles.eventOptionText}>{item.title}</Text>
                </Pressable>
              )}
            />

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowEventPicker(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==========================
          EDIT TICKET MODAL
      ========================== */}
      <Modal visible={showEdit} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Edit Ticket</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Ticket Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Ticket name"
                  placeholderTextColor="#666"
                />

                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Price"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Quantity Total</Text>
                <TextInput
                  style={styles.input}
                  value={editTotal}
                  onChangeText={setEditTotal}
                  placeholder="Quantity total"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />

                <Pressable
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={updateTicket}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setShowEdit(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ==========================
          CREATE TICKET MODAL
      ========================== */}
      <Modal visible={showCreate} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Create Ticket Type</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Ticket Name</Text>
                <TextInput
                  style={styles.input}
                  value={createName}
                  onChangeText={setCreateName}
                  placeholder="e.g VIP, VVIP, Table"
                  placeholderTextColor="#666"
                />

                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={createPrice}
                  onChangeText={setCreatePrice}
                  placeholder="Price"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Quantity Total</Text>
                <TextInput
                  style={styles.input}
                  value={createTotal}
                  onChangeText={setCreateTotal}
                  placeholder="Total quantity"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />

                <Pressable
                  style={[styles.saveBtn, creating && { opacity: 0.6 }]}
                  onPress={createTicketType}
                  disabled={creating}
                >
                  <Text style={styles.saveText}>
                    {creating ? "Creating..." : "Create Ticket"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setShowCreate(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    marginTop: 18,
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

  addBtn: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
  },

  addText: { fontSize: 30, fontWeight: "bold", color: "#000" },

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

  selectedEventTitle: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

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

  emptyText: { color: "#777", textAlign: "center", marginTop: 50 },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },

  ticketName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: { color: "#777", fontSize: 14 },

  value: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  editBtn: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: { color: "#000", fontWeight: "bold", fontSize: 15 },

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

  eventOptionText: { color: "#fff", fontWeight: "bold" },

  modalBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnText: { color: "#fff", fontWeight: "bold" },

  inputLabel: { color: "#aaa", marginTop: 10, marginBottom: 6 },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: "#7CFF00",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 18,
  },

  saveText: { color: "#000", fontWeight: "bold", fontSize: 16 },

  cancelBtn: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },

  cancelText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});