import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../services/api";

export default function OrganizerEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function apiFetch(endpoint, method = "GET", body = null) {
    const token = await AsyncStorage.getItem("access");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return await res.json();
  }

  async function fetchMyEvents() {
    try {
      setLoading(true);

      // your backend events list
      const data = await apiFetch("/api/events/");

      setEvents(data);
    } catch (error) {
      console.log("Fetch events error:", error.message);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEvent(null);

    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    setImage("");

    setShowModal(true);
  }

  function openEditModal(event) {
    setEditingEvent(event);

    setTitle(event.title || "");
    setDescription(event.description || "");
    setLocation(event.location || "");
    setCategory(event.category || "");
    setStartDate(event.start_date || "");
    setEndDate(event.end_date || "");
    setImage(event.image || "");

    setShowModal(true);
  }

  async function handleSaveEvent() {
    if (!title || !description || !location || !category || !startDate || !endDate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    const payload = {
      title,
      description,
      location,
      category,
      start_date: startDate,
      end_date: endDate,
      image,
    };

    try {
      if (editingEvent) {
        await apiFetch(`/api/events/${editingEvent.id}/`, "PUT", payload);
        Alert.alert("Success", "Event updated successfully.");
      } else {
        await apiFetch("/api/events/", "POST", payload);
        Alert.alert("Success", "Event created successfully.");
      }

      setShowModal(false);
      fetchMyEvents();
    } catch (error) {
      console.log("Save event error:", error.message);
      Alert.alert("Error", "Failed to save event. Check backend permissions.");
    }
  }

  async function handleDeleteEvent(eventId) {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/events/${eventId}/`, "DELETE");
            Alert.alert("Deleted", "Event deleted successfully.");
            fetchMyEvents();
          } catch (error) {
            console.log("Delete error:", error.message);
            Alert.alert("Error", "Failed to delete event.");
          }
        },
      },
    ]);
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString();
  }

  function renderEvent({ item }) {
    return (
      <View style={styles.card}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={{ color: "#777" }}>No Image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.location}</Text>

          <Text style={styles.cardSmall}>
            {formatDate(item.start_date)} → {formatDate(item.end_date)}
          </Text>

          <Text style={styles.badge}>{item.category}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.btnEdit} onPress={() => openEditModal(item)}>
              <Text style={styles.btnText}>Edit</Text>
            </Pressable>

            <Pressable
              style={styles.btnDelete}
              onPress={() => handleDeleteEvent(item.id)}
            >
              <Text style={styles.btnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading Events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>My Events</Text>

        <Pressable style={styles.createBtn} onPress={openCreateModal}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </Pressable>
      </View>

      {/* EVENTS LIST */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEvent}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No events found. Create your first event.
          </Text>
        }
      />

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingEvent ? "Edit Event" : "Create Event"}
              </Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor="#777"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                placeholder="Description"
                placeholderTextColor="#777"
                style={[styles.input, { height: 90 }]}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TextInput
                placeholder="Location"
                placeholderTextColor="#777"
                style={styles.input}
                value={location}
                onChangeText={setLocation}
              />

              <TextInput
                placeholder="Category (music, nightlife...)"
                placeholderTextColor="#777"
                style={styles.input}
                value={category}
                onChangeText={setCategory}
              />

              <TextInput
                placeholder="Start Date (YYYY-MM-DDTHH:MM:SSZ)"
                placeholderTextColor="#777"
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
              />

              <TextInput
                placeholder="End Date (YYYY-MM-DDTHH:MM:SSZ)"
                placeholderTextColor="#777"
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
              />

              <TextInput
                placeholder="Image URL (optional)"
                placeholderTextColor="#777"
                style={styles.input}
                value={image}
                onChangeText={setImage}
              />

              <Pressable style={styles.saveBtn} onPress={handleSaveEvent}>
                <Text style={styles.saveBtnText}>
                  {editingEvent ? "Update Event" : "Create Event"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

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
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  back: { color: "#7CFF00", fontSize: 22, fontWeight: "bold" },

  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  createBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  createBtnText: { fontWeight: "bold", color: "#000" },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#111",
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222",
  },

  cardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },

  noImage: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },

  cardBody: {
    padding: 14,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  cardText: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 6,
  },

  cardSmall: {
    color: "#777",
    fontSize: 13,
    marginBottom: 8,
  },

  badge: {
    color: "#7CFF00",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 12,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  btnEdit: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  btnDelete: {
    flex: 1,
    backgroundColor: "#ff3b30",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    maxHeight: "90%",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#0a0a0a",
    color: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },

  saveBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
  },

  saveBtnText: { color: "#000", fontWeight: "bold", fontSize: 16 },

  cancelBtn: {
    backgroundColor: "#222",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  cancelBtnText: { color: "#fff", fontWeight: "bold" },
});