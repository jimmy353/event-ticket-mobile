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
  Image,
  RefreshControl,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // search
  const [search, setSearch] = useState("");

  // refresh
  const [refreshing, setRefreshing] = useState(false);

  // create modal
  const [showCreate, setShowCreate] = useState(false);

  // view modal
  const [showView, setShowView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

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

  // FIXED: no Z (Z forces UTC and can break time)
  function toISO(date, time) {
    return `${date}T${time}:00`;
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  }

  async function fetchEvents() {
    try {
      setLoading(true);

      // FIXED: organizer endpoint
      const res = await apiFetch("/api/events/organizer/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Organizer Events API Error:", data);
        Alert.alert("Error", data?.detail || "Failed to load organizer events.");
        return;
      }

      setEvents(data);
    } catch (error) {
      console.log("❌ Fetch Organizer Events Error:", error);
      Alert.alert("Error", "Failed to load organizer events.");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
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

      // ✅ FIXED ENDPOINT
      const res = await apiFetch("/api/events/create/", {
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

  function openViewModal(event) {
    setSelectedEvent(event);
    setShowView(true);
  }

  function openEditModal(event) {
    setEditingEvent(event);

    setTitle(event.title || "");
    setDescription(event.description || "");
    setLocation(event.location || "");

    if (event.start_date) {
      const s = new Date(event.start_date);
      setStartDate(s.toISOString().slice(0, 10));
      setStartTime(s.toISOString().slice(11, 16));
    }

    if (event.end_date) {
      const e = new Date(event.end_date);
      setEndDate(e.toISOString().slice(0, 10));
      setEndTime(e.toISOString().slice(11, 16));
    }

    setCategory(event.category || "music");
    setImageFile(null);

    setShowEdit(true);
  }

  async function updateEvent() {
    if (!editingEvent) return;

    if (!title || !description || !location) {
      Alert.alert("Missing Fields", "Please fill Title, Description and Location.");
      return;
    }

    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category", category);
      formData.append("start_date", toISO(startDate, startTime));
      formData.append("end_date", toISO(endDate, endTime));

      if (imageFile) {
        formData.append("image", {
          uri: imageFile.uri,
          name: "event.jpg",
          type: "image/jpeg",
        });
      }

      // ✅ FIXED ENDPOINT (matches backend)
      const res = await apiFetch(`/api/events/${editingEvent.id}/`, {
        method: "PUT",
        body: formData,
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Update Event Error:", data);
        Alert.alert("Error", data?.detail || "Failed to update event.");
        return;
      }

      Alert.alert("Updated", "Event updated successfully!");
      setShowEdit(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.log("❌ Update Event Failed:", error);
      Alert.alert("Error", "Failed to update event.");
    } finally {
      setUpdating(false);
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
            // ✅ FIXED ENDPOINT (matches backend)
            const res = await apiFetch(`/api/events/${eventId}/`, {
              method: "DELETE",
            });

            const data = await safeJson(res);

            if (!res.ok) {
              console.log("❌ Delete Event Error:", data);
              Alert.alert("Error", data?.detail || "Failed to delete event.");
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

  const filteredEvents = events.filter((e) => {
    const s = search.toLowerCase();
    return (
      (e.title || "").toLowerCase().includes(s) ||
      (e.location || "").toLowerCase().includes(s) ||
      (e.category || "").toLowerCase().includes(s)
    );
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Organizer Events</Text>

        <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#000" />
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" />
      ) : filteredEvents.length === 0 ? (
        <Text style={styles.empty}>No events found.</Text>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* IMAGE */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={styles.noCardImage}>
                  <Text style={styles.noCardImageText}>No Image</Text>
                </View>
              )}

              <View style={{ paddingTop: 12 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventLocation}>{item.location}</Text>
                <Text style={styles.eventCategory}>
                  Category: {item.category}
                </Text>

                <View style={styles.row}>
                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => openViewModal(item)}
                  >
                    <Text style={styles.viewBtnText}>View</Text>
                  </Pressable>

                  <Pressable
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => deleteEvent(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* VIEW EVENT MODAL */}
      <Modal visible={showView} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.viewModalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEvent?.image ? (
                <Image
                  source={{ uri: selectedEvent.image }}
                  style={styles.modalImage}
                />
              ) : (
                <View style={styles.modalNoImage}>
                  <Text style={{ color: "#777" }}>No Image</Text>
                </View>
              )}

              <Text style={styles.viewTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.viewText}>
                📍 Location: {selectedEvent?.location}
              </Text>
              <Text style={styles.viewText}>
                🎶 Category: {selectedEvent?.category}
              </Text>
              <Text style={styles.viewText}>
                🕒 Start: {formatDate(selectedEvent?.start_date)}
              </Text>
              <Text style={styles.viewText}>
                🕒 End: {formatDate(selectedEvent?.end_date)}
              </Text>

              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>{selectedEvent?.description}</Text>

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

              <Text style={styles.label}>Start date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={startDate}
                onChangeText={setStartDate}
              />

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

              <Text style={styles.label}>End date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={endDate}
                onChangeText={setEndDate}
              />

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

              <Text style={styles.label}>Image:</Text>
              <Pressable style={styles.imageBtn} onPress={pickImage}>
                <Text style={styles.imageBtnText}>
                  {imageFile ? "Image Selected ✅" : "Choose File"}
                </Text>
              </Pressable>

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
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT EVENT MODAL */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Event</Text>

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

              <Text style={styles.label}>Start date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={startDate}
                onChangeText={setStartDate}
              />

              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#777"
                value={startTime}
                onChangeText={setStartTime}
              />

              <Text style={styles.label}>End date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#777"
                value={endDate}
                onChangeText={setEndDate}
              />

              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#777"
                value={endTime}
                onChangeText={setEndTime}
              />

              <Text style={styles.label}>New Image (optional):</Text>
              <Pressable style={styles.imageBtn} onPress={pickImage}>
                <Text style={styles.imageBtnText}>
                  {imageFile ? "New Image Selected ✅" : "Choose File"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, updating && { opacity: 0.6 }]}
                onPress={updateEvent}
                disabled={updating}
              >
                <Text style={styles.modalBtnText}>
                  {updating ? "Updating..." : "Update Event"}
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

  cardImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  noCardImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  noCardImageText: {
    color: "#777",
    fontWeight: "bold",
  },

  eventTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  eventLocation: {
    color: "#aaa",
    marginTop: 6,
    fontSize: 13,
  },

  eventCategory: {
    color: "#7CFF00",
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
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

  note: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 16,
    color: "#fff",
  },

  imageBtn: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  imageBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },

  categoryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
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

  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginBottom: 15,
  },

  modalNoImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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

  descTitle: {
    color: "#7CFF00",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
  },

  descText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 22,
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