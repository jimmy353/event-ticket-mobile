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

export default function OrganizerEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [showCreate, setShowCreate] = useState(false);

  // form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(""); // "2026-02-15T10:00:00Z"
  const [endDate, setEndDate] = useState("");
  const [image, setImage] = useState("");

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Events API Error:", data);
        throw new Error("Failed to load events");
      }

      setEvents(data);
    } catch (error) {
      console.log("❌ Fetch Events Error:", error);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    setImage("");
  }

  async function createEvent() {
    if (!title || !description || !location || !category || !startDate || !endDate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        title,
        description,
        location,
        category,
        start_date: startDate,
        end_date: endDate,
        image: image || null,
      };

      const res = await apiFetch("/api/events/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Create Event Error:", data);
        Alert.alert("Error", data?.detail || "Failed to create event.");
        return;
      }

      Alert.alert("Success", "Event created successfully!");

      setShowCreate(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.log("❌ Create Event Failed:", error);
      Alert.alert("Error", "Failed to create event.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteEvent(eventId) {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await apiFetch(`/api/events/${eventId}/`, {
              method: "DELETE",
            });

            if (!res.ok) {
              const data = await safeJson(res);
              console.log("❌ Delete Event Error:", data);
              Alert.alert("Error", "Failed to delete event.");
              return;
            }

            Alert.alert("Deleted", "Event deleted successfully!");
            fetchEvents();
          } catch (error) {
            console.log("❌ Delete Event Failed:", error);
            Alert.alert("Error", "Failed to delete event.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <Text style={styles.title}>My Events</Text>

        <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createText}>+ Create</Text>
        </Pressable>
      </View>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" />
      ) : events.length === 0 ? (
        <Text style={styles.empty}>No events found. Create your first event.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventLocation}>{item.location}</Text>
              <Text style={styles.eventCategory}>Category: {item.category}</Text>

              <View style={styles.row}>
                <Pressable
                  style={styles.smallBtn}
                  onPress={() =>
                    Alert.alert(
                      "Event Details",
                      `Title: ${item.title}\nLocation: ${item.location}\nStart: ${item.start_date}\nEnd: ${item.end_date}`
                    )
                  }
                >
                  <Text style={styles.smallBtnText}>View</Text>
                </Pressable>

                <Pressable
                  style={[styles.smallBtn, { backgroundColor: "#FF3B30" }]}
                  onPress={() => deleteEvent(item.id)}
                >
                  <Text style={styles.smallBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* CREATE EVENT MODAL */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Event</Text>

              <TextInput
                style={styles.input}
                placeholder="Title *"
                placeholderTextColor="#777"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Description *"
                placeholderTextColor="#777"
                value={description}
                onChangeText={setDescription}
              />

              <TextInput
                style={styles.input}
                placeholder="Location *"
                placeholderTextColor="#777"
                value={location}
                onChangeText={setLocation}
              />

              <TextInput
                style={styles.input}
                placeholder="Category (music, comedy, nightlife) *"
                placeholderTextColor="#777"
                value={category}
                onChangeText={setCategory}
              />

              <TextInput
                style={styles.input}
                placeholder="Start Date (2026-02-15T10:00:00Z) *"
                placeholderTextColor="#777"
                value={startDate}
                onChangeText={setStartDate}
              />

              <TextInput
                style={styles.input}
                placeholder="End Date (2026-02-15T18:00:00Z) *"
                placeholderTextColor="#777"
                value={endDate}
                onChangeText={setEndDate}
              />

              <TextInput
                style={styles.input}
                placeholder="Image URL (optional)"
                placeholderTextColor="#777"
                value={image}
                onChangeText={setImage}
              />

              <Pressable
                style={[styles.modalBtn, creating && { opacity: 0.6 }]}
                onPress={createEvent}
                disabled={creating}
              >
                <Text style={styles.modalBtnText}>
                  {creating ? "Creating..." : "Create Event"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => {
                  setShowCreate(false);
                  resetForm();
                }}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  back: { color: "#7CFF00", fontSize: 22 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  createBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },

  createText: { fontWeight: "bold", color: "#000" },

  empty: { color: "#999", textAlign: "center", marginTop: 50 },

  card: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },

  eventTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  eventLocation: { color: "#aaa", marginTop: 5 },
  eventCategory: { color: "#7CFF00", marginTop: 5 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  smallBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  smallBtnText: { color: "#000", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
    marginBottom: 10,
  },

  modalBtn: {
    backgroundColor: "#7CFF00",
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },

  modalBtnText: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 15,
  },
});