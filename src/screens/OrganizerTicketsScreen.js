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
  TouchableOpacity,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showEventSelect, setShowEventSelect] = useState(false);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchTickets(selectedEvent.id);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events Error:", data);
        throw new Error("Failed to load events");
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
      }
    } catch (error) {
      console.log("❌ Fetch Events Error:", error);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTickets(eventId) {
    try {
      setLoading(true);

      // ✅ correct backend filter
      const res = await apiFetch(`/api/tickets/?event=${eventId}`);
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Tickets Error:", data);
        throw new Error("Failed to load tickets");
      }

      setTickets(data);
    } catch (error) {
      console.log("❌ Fetch Tickets Error:", error);
      Alert.alert("Error", "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(ticket) {
    setEditingTicket(ticket);
    setEditName(ticket.name);
    setEditPrice(ticket.price.toString());
    setEditQuantity(ticket.quantity_total.toString());
    setShowEdit(true);
  }

  async function updateTicket() {
    if (!editingTicket) return;

    if (!editName || !editPrice || !editQuantity) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    try {
      const payload = {
        name: editName,
        price: editPrice,
        quantity_total: parseInt(editQuantity),
      };

      // ✅ correct update endpoint
      const res = await apiFetch(`/api/tickets/${editingTicket.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to update ticket.");
        return;
      }

      Alert.alert("Success", "Ticket updated successfully!");
      setShowEdit(false);
      setEditingTicket(null);

      if (selectedEvent) fetchTickets(selectedEvent.id);
    } catch (error) {
      console.log("❌ Update Ticket Failed:", error);
      Alert.alert("Error", "Failed to update ticket.");
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

            if (!res.ok) {
              const data = await safeJson(res);
              console.log("❌ Delete Ticket Error:", data);
              Alert.alert("Error", "Failed to delete ticket.");
              return;
            }

            Alert.alert("Deleted", "Ticket deleted successfully!");

            if (selectedEvent) fetchTickets(selectedEvent.id);
          } catch (error) {
            console.log("❌ Delete Ticket Failed:", error);
            Alert.alert("Error", "Failed to delete ticket.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Tickets</Text>

        <Pressable style={styles.plusBtn} onPress={() => Alert.alert("Later", "Add Ticket feature next")}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>

      {/* EVENT SELECT */}
      <Pressable style={styles.eventSelectBox} onPress={() => setShowEventSelect(true)}>
        <Text style={styles.eventSelectText}>
          Selected Event:{" "}
          <Text style={{ color: "#7CFF00", fontWeight: "bold" }}>
            {selectedEvent ? selectedEvent.title : "None"}
          </Text>
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </Pressable>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 30 }} />
      ) : tickets.length === 0 ? (
        <Text style={styles.empty}>No ticket types found.</Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.ticketName}>{item.name}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.value}>SSP {item.price}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Total:</Text>
                <Text style={styles.value}>{item.quantity_total}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Sold:</Text>
                <Text style={[styles.value, { color: "#FF3B30" }]}>{item.quantity_sold}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Available:</Text>
                <Text style={[styles.value, { color: "#7CFF00" }]}>{item.available}</Text>
              </View>

              <View style={styles.btnRow}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </Pressable>

                <Pressable style={styles.deleteBtn} onPress={() => deleteTicket(item.id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* EVENT SELECT MODAL */}
      <Modal visible={showEventSelect} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.eventItem,
                    selectedEvent?.id === item.id && { borderColor: "#7CFF00" },
                  ]}
                  onPress={() => {
                    setSelectedEvent(item);
                    setShowEventSelect(false);
                  }}
                >
                  <Text style={styles.eventItemText}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />

            <Pressable style={styles.cancelBtn} onPress={() => setShowEventSelect(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.modalTitle}>Edit Ticket</Text>

            <Text style={styles.formLabel}>Ticket Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

            <Text style={styles.formLabel}>Price</Text>
            <TextInput
              style={styles.input}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Quantity Total</Text>
            <TextInput
              style={styles.input}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
            />

            <Pressable style={styles.saveBtn} onPress={updateTicket}>
              <Text style={styles.saveText}>Save Changes</Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowEdit(false)}
            >
              <Text style={styles.saveText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 18 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 45, // ✅ header moved down
    paddingBottom: 20,
  },

  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  backText: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  plusBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
  },

  plusText: { fontSize: 26, fontWeight: "bold", color: "#000" },

  eventSelectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },

  eventSelectText: { color: "#aaa", fontSize: 14 },
  dropdownIcon: { color: "#7CFF00", fontSize: 14, fontWeight: "bold" },

  empty: { color: "#888", textAlign: "center", marginTop: 50, fontSize: 15 },

  card: {
    backgroundColor: "#111",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },

  ticketName: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#666", fontSize: 14 },
  value: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },

  editBtn: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#7CFF00",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  deleteBtn: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: { color: "#000", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  editBox: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 18 },

  eventItem: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 10,
    backgroundColor: "#000",
  },

  eventItemText: { color: "#fff", fontWeight: "bold" },

  cancelBtn: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 15,
    marginTop: 10,
    alignItems: "center",
  },

  cancelText: { color: "#fff", fontWeight: "bold" },

  formLabel: { color: "#aaa", marginTop: 10, marginBottom: 5 },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: "#7CFF00",
    padding: 14,
    borderRadius: 16,
    marginTop: 18,
    alignItems: "center",
  },

  saveText: { fontWeight: "bold", color: "#000", fontSize: 15 },
});