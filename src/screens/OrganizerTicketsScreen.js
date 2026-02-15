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
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const [search, setSearch] = useState("");

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editTotal, setEditTotal] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

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
        fetchTickets(data[0].id);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.log("❌ Fetch events failed:", err);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTickets(eventId) {
    try {
      setLoading(true);

      // ✅ IMPORTANT: adjust this endpoint if your backend is different
      const res = await apiFetch(`/api/tickets/?event=${eventId}`);
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Tickets error:", data);
        Alert.alert("Error", data?.detail || "Failed to load tickets.");
        return;
      }

      setTickets(data);
    } catch (err) {
      console.log("❌ Fetch tickets failed:", err);
      Alert.alert("Error", "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(ticket) {
    setEditingTicket(ticket);
    setEditName(ticket.name || "");
    setEditPrice(ticket.price ? String(ticket.price) : "");
    setEditTotal(ticket.quantity_total ? String(ticket.quantity_total) : "");
    setShowEdit(true);
  }

  async function updateTicket() {
    if (!editingTicket) return;

    if (!editName || !editPrice || !editTotal) {
      Alert.alert("Missing Fields", "Fill all fields.");
      return;
    }

    try {
      setSaving(true);

      const body = {
        name: editName,
        price: editPrice,
        quantity_total: editTotal,
      };

      const res = await apiFetch(`/api/tickets/${editingTicket.id}/`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

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

      if (selectedEvent) {
        fetchTickets(selectedEvent.id);
      }
    } catch (err) {
      console.log("❌ Update ticket failed:", err);
      Alert.alert("Error", "Ticket update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTicket(ticketId) {
    Alert.alert("Delete Ticket", "Are you sure you want to delete this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await apiFetch(`/api/tickets/${ticketId}/`, {
              method: "DELETE",
            });

            // DELETE often returns 204 with empty body
            if (!res.ok) {
              const data = await safeJson(res);
              console.log("❌ Delete ticket error:", data);

              Alert.alert(
                "Error",
                data?.detail || data?.error || "Failed to delete ticket."
              );
              return;
            }

            Alert.alert("Deleted", "Ticket deleted successfully!");

            if (selectedEvent) {
              fetchTickets(selectedEvent.id);
            }
          } catch (err) {
            console.log("❌ Delete ticket failed:", err);
            Alert.alert("Error", "Failed to delete ticket.");
          }
        },
      },
    ]);
  }

  const filteredTickets = tickets.filter((t) =>
    (t.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Tickets</Text>

        <Pressable
          style={styles.addBtn}
          onPress={() => Alert.alert("Coming soon", "Add Ticket feature next")}
        >
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>

      {/* SELECT EVENT */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventPicker(true)}
      >
        <Text style={styles.selectEventText}>
          Selected Event:{" "}
          <Text style={{ color: "#7CFF00", fontWeight: "bold" }}>
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
          contentContainerStyle={{ paddingBottom: 50 }}
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

      {/* EVENT PICKER MODAL */}
      <Modal visible={showEventPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

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

      {/* EDIT TICKET MODAL */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Ticket</Text>

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
    marginTop: 12, // ✅ brings header down
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

  ticketName: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 },

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