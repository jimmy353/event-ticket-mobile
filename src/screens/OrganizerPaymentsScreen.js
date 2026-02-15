import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, safeJson } from "../services/api";

export default function OrganizerPaymentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showEventPicker, setShowEventPicker] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (!res.ok) {
        console.log("❌ Organizer Payments Events error:", data);
        Alert.alert("Error", data?.detail || "Failed to load events.");
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
      } else {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.log("❌ Organizer Payments fetch events failed:", err);
      Alert.alert("Error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7CFF00" />
        </Pressable>

        <Text style={styles.title}>Payments</Text>

        <Pressable style={styles.refreshBtn} onPress={fetchEvents}>
          <Ionicons name="refresh" size={22} color="#00d4ff" />
        </Pressable>
      </View>

      {/* SELECT EVENT */}
      <Pressable
        style={styles.selectEventBtn}
        onPress={() => setShowEventPicker(true)}
      >
        <View>
          <Text style={styles.selectLabel}>Selected Event</Text>
          <Text style={styles.selectValue}>
            {selectedEvent ? selectedEvent.title : "No Event Found"}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={20} color="#7CFF00" />
      </Pressable>

      {/* BODY */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7CFF00" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <View style={styles.body}>
          <Ionicons name="card" size={60} color="#7CFF00" />
          <Text style={styles.textTitle}>Payments Module</Text>

          <Text style={styles.textDesc}>
            This screen will show payments made for the selected event.
          </Text>

          <Text style={styles.note}>
            Selected Event ID: {selectedEvent ? selectedEvent.id : "None"}
          </Text>

          <Pressable
            style={styles.comingBtn}
            onPress={() =>
              Alert.alert("Coming Soon", "Payments list will be added next.")
            }
          >
            <Text style={styles.comingBtnText}>View Payments (Soon)</Text>
          </Pressable>
        </View>
      )}

      {/* EVENT PICKER MODAL */}
      <Modal visible={showEventPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            {events.length === 0 ? (
              <Text style={styles.emptyText}>No events available.</Text>
            ) : (
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
                    }}
                  >
                    <Text style={styles.eventOptionText}>{item.title}</Text>
                    <Text style={styles.eventOptionSmall}>{item.location}</Text>
                  </Pressable>
                )}
              />
            )}

            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#333" }]}
              onPress={() => setShowEventPicker(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  selectEventBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  selectLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },

  selectValue: {
    color: "#7CFF00",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 14,
  },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  textTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
  },

  textDesc: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  note: {
    color: "#666",
    marginTop: 20,
    fontSize: 12,
  },

  comingBtn: {
    marginTop: 25,
    backgroundColor: "#7CFF00",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 22,
  },

  comingBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },

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

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
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

  eventOptionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  eventOptionSmall: {
    color: "#777",
    marginTop: 4,
    fontSize: 12,
  },

  modalBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});