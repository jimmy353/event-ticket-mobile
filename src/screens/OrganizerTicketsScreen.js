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
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  // create modal
  const [showCreate, setShowCreate] = useState(false);

  // view modal
  const [showView, setShowView] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  // form states
  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantityTotal, setQuantityTotal] = useState("");

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  function resetForm() {
    setEventId("");
    setName("");
    setPrice("");
    setQuantityTotal("");
  }

  async function fetchAll() {
    try {
      setLoading(true);

      const eventsRes = await apiFetch("/api/events/");
      const eventsData = await safeJson(eventsRes);

      if (!eventsRes.ok) {
        console.log("❌ Events Error:", eventsData);
        Alert.alert("Error", "Failed to load events list.");
        return;
      }

      setEvents(eventsData.results ? eventsData.results : eventsData);

      const ticketsRes = await apiFetch("/api/tickets/");
      const ticketsData = await safeJson(ticketsRes);

      if (!ticketsRes.ok) {
        console.log("❌ Tickets Error:", ticketsData);
        Alert.alert("Error", "Failed to load tickets.");
        return;
      }

      setTickets(ticketsData.results ? ticketsData.results : ticketsData);
    } catch (error) {
      console.log("❌ FetchAll Error:", error);
      Alert.alert("Error", "Failed to load ticket types.");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  function getEventName(id) {
    const found = events.find((e) => String(e.id) === String(id));
    return found ? found.title : "Unknown Event";
  }

  function openView(ticket) {
    setSelectedTicket(ticket);
    setShowView(true);
  }

  function openEdit(ticket) {
    setEditingTicket(ticket);

    setEventId(ticket.event ? String(ticket.event) : "");
    setName(ticket.name || "");
    setPrice(ticket.price ? String(ticket.price) : "");
    setQuantityTotal(ticket.quantity_total ? String(ticket.quantity_total) : "");

    setShowEdit(true);
  }

  async function createTicket() {
    if (!eventId || !name || !price || !quantityTotal) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Invalid Price", "Price must be a number greater than 0.");
      return;
    }

    if (isNaN(Number(quantityTotal)) || Number(quantityTotal) <= 0) {
      Alert.alert("Invalid Quantity", "Quantity must be a number greater than 0.");
      return;
    }

    try {
      setCreating(true);

      const res = await apiFetch("/api/tickets/", {
        method: "POST",
        body: JSON.stringify({
          event: eventId,
          name,
          price,
          quantity_total: quantityTotal,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Create Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to create ticket type.");
        return;
      }

      Alert.alert("Success", "Ticket Type created successfully!");

      setShowCreate(false);
      resetForm();
      fetchAll();
    } catch (error) {
      console.log("❌ Create Ticket Exception:", error);
      Alert.alert("Error", "Failed to create ticket type.");
    } finally {
      setCreating(false);
    }
  }

  async function updateTicket() {
    if (!editingTicket) return;

    if (!eventId || !name || !price || !quantityTotal) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    try {
      setUpdating(true);

      const res = await apiFetch(`/api/tickets/${editingTicket.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          event: eventId,
          name,
          price,
          quantity_total: quantityTotal,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to update ticket type.");
        return;
      }

      Alert.alert("Updated", "Ticket Type updated successfully!");

      setShowEdit(false);
      resetForm();
      fetchAll();
    } catch (error) {
      console.log("❌ Update Ticket Exception:", error);
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
            fetchAll();
          } catch (error) {
            console.log("❌ Delete Ticket Exception:", error);
            Alert.alert("Error", "Failed to delete ticket type.");
          }
        },
      },
    ]);
  }

  const filteredTickets = tickets.filter((t) => {
    const s = search.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(s) ||
      getEventName(t.event).toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#777", marginTop: 10 }}>
          Loading Ticket Types...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Tickets</Text>

        <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#000" />
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ticket types..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* LIST */}
      {filteredTickets.length === 0 ? (
        <Text style={styles.empty}>No ticket types found.</Text>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.ticketTitle}>{item.name}</Text>

              <Text style={styles.ticketText}>
                🎟 Event: {getEventName(item.event)}
              </Text>

              <Text style={styles.ticketText}>💰 Price: SSP {item.price}</Text>

              <Text style={styles.ticketText}>
                📦 Total Qty: {item.quantity_total}
              </Text>

              <Text style={styles.ticketText}>
                ✅ Sold: {item.quantity_sold || 0}
              </Text>

              <View style={styles.row}>
                <Pressable style={styles.viewBtn} onPress={() => openView(item)}>
                  <Text style={styles.viewBtnText}>View</Text>
                </Pressable>

                <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => deleteTicket(item.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* VIEW MODAL */}
      <Modal visible={showView} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.viewModalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.viewTitle}>{selectedTicket?.name}</Text>

              <Text style={styles.viewText}>
                🎟 Event: {getEventName(selectedTicket?.event)}
              </Text>

              <Text style={styles.viewText}>
                💰 Price: SSP {selectedTicket?.price}
              </Text>

              <Text style={styles.viewText}>
                📦 Total Quantity: {selectedTicket?.quantity_total}
              </Text>

              <Text style={styles.viewText}>
                ✅ Sold: {selectedTicket?.quantity_sold || 0}
              </Text>

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowView(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Ticket Type</Text>

              <Text style={styles.label}>Event ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event id (example: 1)"
                placeholderTextColor="#777"
                value={eventId}
                onChangeText={setEventId}
              />

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
                placeholder="Example: 5000"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>Quantity Total:</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: 200"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={quantityTotal}
                onChangeText={setQuantityTotal}
              />

              <Pressable
                style={[styles.modalBtn, creating && { opacity: 0.6 }]}
                onPress={createTicket}
                disabled={creating}
              >
                <Text style={styles.modalBtnText}>
                  {creating ? "Creating..." : "Create Ticket"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Ticket Type</Text>

              <Text style={styles.label}>Event ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event id"
                placeholderTextColor="#777"
                value={eventId}
                onChangeText={setEventId}
              />

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
                placeholder="Example: 5000"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>Quantity Total:</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: 200"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={quantityTotal}
                onChangeText={setQuantityTotal}
              />

              <Pressable
                style={[styles.modalBtn, updating && { opacity: 0.6 }]}
                onPress={updateTicket}
                disabled={updating}
              >
                <Text style={styles.modalBtnText}>
                  {updating ? "Updating..." : "Update Ticket"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => {
                  setShowEdit(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Cancel
                </Text>
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
    paddingTop: 60,
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7CFF00",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
    fontSize: 15,
  },

  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 60,
    fontSize: 14,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  ticketTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },

  ticketText: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 5,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },

  viewBtn: {
    flex: 1,
    backgroundColor: "#00d4ff",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  viewBtnText: {
    color: "#000",
    fontWeight: "bold",
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#7CFF00",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  editBtnText: {
    color: "#000",
    fontWeight: "bold",
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  modalBox: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  label: {
    color: "#aaa",
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 5,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 16,
    color: "#fff",
  },

  modalBtn: {
    backgroundColor: "#7CFF00",
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 16,
  },

  modalBtnText: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 15,
  },

  viewModalBox: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  viewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  viewText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },

  modalCloseBtn: {
    backgroundColor: "#7CFF00",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 18,
  },

  modalCloseText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },
});