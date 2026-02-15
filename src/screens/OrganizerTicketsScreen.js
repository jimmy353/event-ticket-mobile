import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerTicketsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");

  // modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // form states
  const [ticketName, setTicketName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState("");

  const [editingTicket, setEditingTicket] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // ----------------------------
  // FETCH EVENTS
  // ----------------------------
  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events API Error:", data);
        Alert.alert("Error", "Failed to load events.");
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
        fetchTickets(data[0].id);
      } else {
        setSelectedEvent(null);
        setTickets([]);
      }
    } catch (error) {
      console.log("❌ Fetch Events Error:", error);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // FETCH TICKETS
  // ----------------------------
  async function fetchTickets(eventId) {
    try {
      setLoading(true);

      const res = await apiFetch(`/api/tickets/?event=${eventId}`);
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Tickets API Error:", data);
        Alert.alert("Error", "Failed to load tickets.");
        return;
      }

      setTickets(data);
    } catch (error) {
      console.log("❌ Fetch Tickets Error:", error);
      Alert.alert("Error", "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // RESET FORM
  // ----------------------------
  function resetForm() {
    setTicketName("");
    setTicketPrice("");
    setTicketQuantity("");
    setEditingTicket(null);
  }

  // ----------------------------
  // CREATE TICKET
  // ----------------------------
  async function createTicket() {
    if (!selectedEvent) {
      Alert.alert("Error", "Select an event first.");
      return;
    }

    if (!ticketName || !ticketPrice || !ticketQuantity) {
      Alert.alert("Missing Fields", "Fill name, price and quantity.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/tickets/", {
        method: "POST",
        body: JSON.stringify({
          event: selectedEvent.id,
          name: ticketName,
          price: ticketPrice,
          quantity_total: ticketQuantity,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Create Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to create ticket.");
        return;
      }

      Alert.alert("Success", "Ticket type created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchTickets(selectedEvent.id);
    } catch (error) {
      console.log("❌ Create Ticket Failed:", error);
      Alert.alert("Error", "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // OPEN EDIT MODAL
  // ----------------------------
  function openEdit(ticket) {
    setEditingTicket(ticket);
    setTicketName(ticket.name);
    setTicketPrice(ticket.price.toString());
    setTicketQuantity(ticket.quantity_total.toString());
    setShowEditModal(true);
  }

  // ----------------------------
  // UPDATE TICKET
  // ----------------------------
  async function updateTicket() {
    if (!editingTicket) return;

    if (!ticketName || !ticketPrice || !ticketQuantity) {
      Alert.alert("Missing Fields", "Fill name, price and quantity.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch(`/api/tickets/${editingTicket.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          event: selectedEvent.id,
          name: ticketName,
          price: ticketPrice,
          quantity_total: ticketQuantity,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update Ticket Error:", data);
        Alert.alert("Error", data?.detail || "Failed to update ticket.");
        return;
      }

      Alert.alert("Success", "Ticket updated successfully!");
      setShowEditModal(false);
      resetForm();
      fetchTickets(selectedEvent.id);
    } catch (error) {
      console.log("❌ Update Ticket Failed:", error);
      Alert.alert("Error", "Failed to update ticket.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // DELETE TICKET
  // ----------------------------
  async function deleteTicket(ticketId) {
    Alert.alert("Delete Ticket", "Are you sure you want to delete this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

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
            fetchTickets(selectedEvent.id);
          } catch (error) {
            console.log("❌ Delete Ticket Failed:", error);
            Alert.alert("Error", "Failed to delete ticket.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  // ----------------------------
  // SEARCH FILTER
  // ----------------------------
  const filteredTickets = tickets.filter((ticket) =>
    ticket.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Tickets</Text>

        <Pressable
          style={styles.addBtn}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>

      {/* SELECT EVENT BUTTON */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventModal(true)}
      >
        <Text style={styles.selectEventLabel}>Selected Event:</Text>

        <Text style={styles.selectEventName}>
          {selectedEvent ? selectedEvent.title : "No Event Selected"}
        </Text>

        <Text style={styles.selectEventArrow}>▼</Text>
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

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" style={{ marginTop: 40 }} />
      ) : selectedEvent === null ? (
        <Text style={styles.emptyText}>No events found. Create an event first.</Text>
      ) : filteredTickets.length === 0 ? (
        <Text style={styles.emptyText}>No ticket types found.</Text>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketName}>{item.name}</Text>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Price:</Text>
                <Text style={styles.ticketValue}>SSP {item.price}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Total:</Text>
                <Text style={styles.ticketValue}>{item.quantity_total}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Sold:</Text>
                <Text style={styles.ticketSold}>{item.quantity_sold}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Available:</Text>
                <Text style={styles.ticketAvailable}>{item.available}</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => deleteTicket(item.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* EVENT SELECT MODAL */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {events.map((event) => (
                <Pressable
                  key={event.id}
                  style={[
                    styles.eventOption,
                    selectedEvent?.id === event.id && styles.eventActive,
                  ]}
                  onPress={() => {
                    setSelectedEvent(event);
                    setShowEventModal(false);
                    fetchTickets(event.id);
                  }}
                >
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowEventModal(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalBox}>
            <Text style={styles.modalTitle}>Add Ticket Type</Text>

            <Text style={styles.label}>Ticket Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Regular / VIP / VVIP"
              placeholderTextColor="#666"
              value={ticketName}
              onChangeText={setTicketName}
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="15000"
              placeholderTextColor="#666"
              value={ticketPrice}
              onChangeText={setTicketPrice}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Quantity Total</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor="#666"
              value={ticketQuantity}
              onChangeText={setTicketQuantity}
              keyboardType="numeric"
            />

            <Pressable style={styles.saveBtn} onPress={createTicket}>
              <Text style={styles.saveText}>Create Ticket</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalBox}>
            <Text style={styles.modalTitle}>Edit Ticket Type</Text>

            <Text style={styles.label}>Ticket Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Regular / VIP / VVIP"
              placeholderTextColor="#666"
              value={ticketName}
              onChangeText={setTicketName}
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="15000"
              placeholderTextColor="#666"
              value={ticketPrice}
              onChangeText={setTicketPrice}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Quantity Total</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor="#666"
              value={ticketQuantity}
              onChangeText={setTicketQuantity}
              keyboardType="numeric"
            />

            <Pressable style={styles.saveBtn} onPress={updateTicket}>
              <Text style={styles.saveText}>Save Changes</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 18,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
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

  backText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -3,
  },

  /* SELECT EVENT BUTTON */
  selectEventBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  selectEventLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
  },

  selectEventName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 10,
  },

  selectEventArrow: {
    color: "#7CFF00",
    fontSize: 14,
    fontWeight: "bold",
  },

  /* SEARCH */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 15,
  },

  searchIcon: {
    color: "#666",
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },

  /* EMPTY */
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 80,
    fontSize: 14,
  },

  /* CARD */
  ticketCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  ticketName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  ticketLabel: {
    color: "#777",
    fontSize: 13,
  },

  ticketValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },

  ticketSold: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "bold",
  },

  ticketAvailable: {
    color: "#7CFF00",
    fontSize: 13,
    fontWeight: "bold",
  },

  /* ACTIONS */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#7CFF00",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 8,
  },

  editText: {
    color: "#000",
    fontWeight: "bold",
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 8,
  },

  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#111",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: "#222",
  },

  formModalBox: {
    backgroundColor: "#111",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  eventOption: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#222",
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
  },

  eventActive: {
    borderColor: "#7CFF00",
  },

  eventTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  eventLocation: {
    color: "#777",
    marginTop: 4,
    fontSize: 12,
  },

  closeBtn: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },

  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* FORM */
  label: {
    color: "#aaa",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#222",
    padding: 14,
    borderRadius: 16,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: "#7CFF00",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 18,
  },

  saveText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelBtn: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },

  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});