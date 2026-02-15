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
  ScrollView,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [tickets, setTickets] = useState([]);

  const [showSelectEvent, setShowSelectEvent] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);

  // Create form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantityTotal, setQuantityTotal] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantityTotal, setEditQuantityTotal] = useState("");

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

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
        fetchTickets(data[0].id);
      } else {
        setTickets([]);
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

  function resetCreateForm() {
    setName("");
    setPrice("");
    setQuantityTotal("");
  }

  function openView(ticket) {
    setSelectedTicket(ticket);
    setShowView(true);
  }

  function openEdit(ticket) {
    setSelectedTicket(ticket);

    setEditName(ticket.name);
    setEditPrice(ticket.price.toString());
    setEditQuantityTotal(ticket.quantity_total.toString());

    setShowEdit(true);
  }

  async function createTicketType() {
    if (!selectedEvent) {
      Alert.alert("Select Event", "Please select an event first.");
      return;
    }

    if (!name || !price || !quantityTotal) {
      Alert.alert("Missing Fields", "Fill Name, Price and Quantity.");
      return;
    }

    try {
      setCreating(true);

      const res = await apiFetch("/api/tickets/", {
        method: "POST",
        body: JSON.stringify({
          event: selectedEvent.id,
          name: name,
          price: price,
          quantity_total: quantityTotal,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Create Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to create ticket type.");
        return;
      }

      Alert.alert("Success", "Ticket type created!");
      setShowCreate(false);
      resetCreateForm();
      fetchTickets(selectedEvent.id);
    } catch (error) {
      console.log("❌ Create Ticket Failed:", error);
      Alert.alert("Error", "Failed to create ticket type.");
    } finally {
      setCreating(false);
    }
  }

  async function updateTicketType() {
    if (!selectedTicket) return;

    if (!editName || !editPrice || !editQuantityTotal) {
      Alert.alert("Missing Fields", "Fill all fields.");
      return;
    }

    try {
      setUpdating(true);

      const res = await apiFetch(`/api/tickets/${selectedTicket.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          price: editPrice,
          quantity_total: editQuantityTotal,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to update ticket type.");
        return;
      }

      Alert.alert("Success", "Ticket updated successfully!");
      setShowEdit(false);
      fetchTickets(selectedEvent.id);
    } catch (error) {
      console.log("❌ Update Ticket Failed:", error);
      Alert.alert("Error", "Failed to update ticket type.");
    } finally {
      setUpdating(false);
    }
  }

  async function deleteTicket(ticketId) {
    Alert.alert("Delete Ticket Type", "Are you sure you want to delete this?", [
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
              Alert.alert("Error", "Failed to delete ticket type.");
              return;
            }

            Alert.alert("Deleted", "Ticket type deleted successfully!");
            fetchTickets(selectedEvent.id);
          } catch (error) {
            console.log("❌ Delete Ticket Failed:", error);
            Alert.alert("Error", "Failed to delete ticket type.");
          }
        },
      },
    ]);
  }

  function TicketCard({ item }) {
    const total = Number(item.quantity_total);
    const sold = Number(item.quantity_sold);
    const available = Number(item.available);

    const percent = total > 0 ? (sold / total) * 100 : 0;

    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.ticketName}>{item.name}</Text>
          <Text style={styles.price}>SSP {item.price}</Text>
        </View>

        <Text style={styles.details}>
          Total: {total} | Sold: {sold} | Available: {available}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.viewBtn} onPress={() => openView(item)}>
            <Text style={styles.btnTextDark}>View</Text>
          </Pressable>

          <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.btnTextDark}>Edit</Text>
          </Pressable>

          <Pressable
            style={styles.deleteBtn}
            onPress={() => deleteTicket(item.id)}
          >
            <Text style={styles.btnTextLight}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>Organizer Tickets</Text>

          <Pressable
            style={styles.eventSelectBtn}
            onPress={() => setShowSelectEvent(true)}
          >
            <Text style={styles.eventSelectText}>
              {selectedEvent ? selectedEvent.title : "Select Event"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>

      {/* BODY */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" />
      ) : tickets.length === 0 ? (
        <Text style={styles.empty}>No ticket types found.</Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TicketCard item={item} />}
        />
      )}

      {/* SELECT EVENT MODAL */}
      <Modal visible={showSelectEvent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <ScrollView>
              {events.map((ev) => (
                <Pressable
                  key={ev.id}
                  style={[
                    styles.eventItem,
                    selectedEvent?.id === ev.id && styles.eventItemActive,
                  ]}
                  onPress={() => {
                    setSelectedEvent(ev);
                    setShowSelectEvent(false);
                    fetchTickets(ev.id);
                  }}
                >
                  <Text style={styles.eventItemTitle}>{ev.title}</Text>
                  <Text style={styles.eventItemLocation}>{ev.location}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowSelectEvent(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Ticket Type</Text>

              <Text style={styles.label}>Event:</Text>
              <Text style={styles.selectedEventText}>
                {selectedEvent ? selectedEvent.title : "No event selected"}
              </Text>

              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Regular / VIP / VVIP"
                placeholderTextColor="#777"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Price:</Text>
              <TextInput
                style={styles.input}
                placeholder="15000"
                placeholderTextColor="#777"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Quantity Total:</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#777"
                value={quantityTotal}
                onChangeText={setQuantityTotal}
                keyboardType="numeric"
              />

              <Pressable
                style={[styles.modalBtn, creating && { opacity: 0.6 }]}
                onPress={createTicketType}
                disabled={creating}
              >
                <Text style={styles.modalBtnText}>
                  {creating ? "Creating..." : "Create Ticket Type"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* VIEW MODAL */}
      <Modal visible={showView} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.viewModalBox}>
            <Text style={styles.modalTitle}>Ticket Details</Text>

            {selectedTicket && (
              <View style={styles.viewDetails}>
                <Text style={styles.viewLabel}>Name:</Text>
                <Text style={styles.viewValue}>{selectedTicket.name}</Text>

                <Text style={styles.viewLabel}>Price:</Text>
                <Text style={styles.viewValue}>SSP {selectedTicket.price}</Text>

                <Text style={styles.viewLabel}>Quantity Total:</Text>
                <Text style={styles.viewValue}>
                  {selectedTicket.quantity_total}
                </Text>

                <Text style={styles.viewLabel}>Quantity Sold:</Text>
                <Text style={styles.viewValue}>
                  {selectedTicket.quantity_sold}
                </Text>

                <Text style={styles.viewLabel}>Available:</Text>
                <Text style={styles.viewValue}>{selectedTicket.available}</Text>
              </View>
            )}

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowView(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Ticket Type</Text>

              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.label}>Price:</Text>
              <TextInput
                style={styles.input}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Quantity Total:</Text>
              <TextInput
                style={styles.input}
                value={editQuantityTotal}
                onChangeText={setEditQuantityTotal}
                keyboardType="numeric"
              />

              <Pressable
                style={[styles.modalBtn, updating && { opacity: 0.6 }]}
                onPress={updateTicketType}
                disabled={updating}
              >
                <Text style={styles.modalBtnText}>
                  {updating ? "Updating..." : "Save Changes"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => setShowEdit(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  backText: { color: "#7CFF00", fontSize: 20 },

  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  eventSelectBtn: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },

  eventSelectText: {
    color: "#7CFF00",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },

  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
  },

  addText: { color: "#000", fontSize: 26, fontWeight: "bold" },

  empty: { color: "#999", textAlign: "center", marginTop: 50 },

  card: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ticketName: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  price: { color: "#7CFF00", fontWeight: "bold", fontSize: 14 },

  details: { color: "#aaa", marginTop: 8, fontSize: 13 },

  progressBg: {
    height: 8,
    backgroundColor: "#222",
    borderRadius: 10,
    marginTop: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7CFF00",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  viewBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    marginRight: 6,
    alignItems: "center",
  },

  editBtn: {
    backgroundColor: "#FFD60A",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    marginRight: 6,
    alignItems: "center",
  },

  deleteBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },

  btnTextDark: { color: "#000", fontWeight: "bold" },
  btnTextLight: { color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  viewModalBox: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  label: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 5,
  },

  selectedEventText: {
    color: "#7CFF00",
    fontWeight: "bold",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
  },

  modalBtn: {
    backgroundColor: "#7CFF00",
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 15,
  },

  modalBtnText: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 15,
  },

  eventItem: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 10,
  },

  eventItemActive: {
    borderColor: "#7CFF00",
  },

  eventItemTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  eventItemLocation: {
    color: "#aaa",
    marginTop: 5,
    fontSize: 12,
  },

  viewDetails: {
    marginTop: 10,
    marginBottom: 20,
  },

  viewLabel: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 12,
  },

  viewValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 2,
  },
});