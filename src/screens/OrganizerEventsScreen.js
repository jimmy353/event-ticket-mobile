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

import * as ImagePicker from "expo-image-picker";

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

  // Start date/time
  const [startDate, setStartDate] = useState("2026-02-15");
  const [startTime, setStartTime] = useState("10:00");

  // End date/time
  const [endDate, setEndDate] = useState("2026-02-15");
  const [endTime, setEndTime] = useState("18:00");

  const [category, setCategory] = useState("music");

  const [imageFile, setImageFile] = useState(null);

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
    setStartDate("2026-02-15");
    setStartTime("10:00");
    setEndDate("2026-02-15");
    setEndTime("18:00");
    setCategory("music");
    setImageFile(null);
  }

  function toISO(date, time) {
    // combine into ISO string
    // Example: "2026-02-15T10:00:00Z"
    return `${date}T${time}:00Z`;
  }

  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow gallery access to pick image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.log("❌ Image Pick Error:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  }

  async function createEvent() {
    if (!title || !description || !location) {
      Alert.alert("Missing Fields", "Please fill Title, Description and Location.");
      return;
    }

    if (!imageFile) {
      Alert.alert("Missing Image", "Please select an image.");
      return;
    }

    try {
      setCreating(true);

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category", category);

      formData.append("start_date", toISO(startDate, startTime));
      formData.append("end_date", toISO(endDate, endTime));

      formData.append("image", {
        uri: imageFile.uri,
        name: "event.jpg",
        type: "image/jpeg",
      });

      const res = await apiFetch("/api/events/", {
        method: "POST",
        body: formData,
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
              <Text style={styles.modalTitle}>Add Event</Text>

              <Text style={styles.label}>Title:</Text>
              <TextInput
                style={styles.input}
                placeholder="Event title"
                placeholderTextColor="#777"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description:</Text>
              <TextInput
                style={styles.input}
                placeholder="Event description"
                placeholderTextColor="#777"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Location:</Text>
              <TextInput
                style={styles.input}
                placeholder="Event location"
                placeholderTextColor="#777"
                value={location}
                onChangeText={setLocation}
              />

              {/* START DATE */}
              <Text style={styles.label}>Start date:</Text>
              <Text style={styles.subLabel}>Date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={startDate}
                onChangeText={setStartDate}
              />

              <Text style={styles.subLabel}>Time:</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#777"
                value={startTime}
                onChangeText={setStartTime}
              />

              <Text style={styles.note}>
                Note: You are 4 hours ahead of server time.
              </Text>

              {/* END DATE */}
              <Text style={styles.label}>End date:</Text>
              <Text style={styles.subLabel}>Date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={endDate}
                onChangeText={setEndDate}
              />

              <Text style={styles.subLabel}>Time:</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#777"
                value={endTime}
                onChangeText={setEndTime}
              />

              <Text style={styles.note}>
                Note: You are 4 hours ahead of server time.
              </Text>

              {/* IMAGE */}
              <Text style={styles.label}>Image:</Text>

              <Pressable style={styles.imageBtn} onPress={pickImage}>
                <Text style={styles.imageBtnText}>
                  {imageFile ? "Image Selected ✅" : "Choose File"}
                </Text>
              </Pressable>

              {/* CATEGORY */}
              <Text style={styles.label}>Category:</Text>

              <View style={styles.categoryRow}>
                {["music", "comedy", "nightlife"].map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      category === cat && styles.categoryActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ORGANIZER */}
              <Text style={styles.label}>Organizer:</Text>
              <Text style={styles.organizerText}>Auto from your account</Text>

              {/* SUBMIT */}
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
    maxHeight: "92%",
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

  subLabel: {
    color: "#aaa",
    marginTop: 5,
    marginBottom: 4,
  },

  note: {
    color: "#777",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },

  organizerText: {
    color: "#7CFF00",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
  },

  imageBtn: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  imageBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  categoryBtn: {
    borderWidth: 1,
    borderColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },

  categoryActive: {
    backgroundColor: "#7CFF00",
    borderColor: "#7CFF00",
  },

  categoryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  categoryTextActive: {
    color: "#000",
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
});