import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../services/api";

export default function CreateTicketTypeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [tickets, setTickets] = useState([
    { name: "Regular", price: "", quantity_total: "" },
  ]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await apiFetch("/api/events/my-events/");
      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Failed to load events.");
        return;
      }

      setEvents(data);

      if (data.length > 0) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  function addTicketRow() {
    setTickets((prev) => [
      ...prev,
      { name: "", price: "", quantity_total: "" },
    ]);
  }

  function removeTicketRow(index) {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTicket(index, key, value) {
    setTickets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  function validateTickets() {
    const clean = tickets
      .map((t) => ({
        name: (t.name || "").trim(),
        price: (t.price || "").toString().trim(),
        quantity_total: (t.quantity_total || "").toString().trim(),
      }))
      .filter((t) => t.name || t.price || t.quantity_total);

    if (clean.length === 0) {
      Alert.alert("Ticket Types Required", "Please add at least 1 ticket type.");
      return null;
    }

    for (const t of clean) {
      if (!t.name) {
        Alert.alert("Invalid Ticket", "Ticket name is required.");
        return null;
      }
      if (!t.price || isNaN(Number(t.price)) || Number(t.price) <= 0) {
        Alert.alert("Invalid Ticket", "Ticket price must be a number > 0.");
        return null;
      }
      if (
        !t.quantity_total ||
        isNaN(Number(t.quantity_total)) ||
        Number(t.quantity_total) <= 0
      ) {
        Alert.alert("Invalid Ticket", "Ticket quantity must be a number > 0.");
        return null;
      }
    }

    return clean;
  }

  async function submitTickets() {
    if (!selectedEvent) {
      Alert.alert("No Event", "Please select an event first.");
      return;
    }

    const ticketPayload = validateTickets();
    if (!ticketPayload) return;

    setLoading(true);

    try {
      for (const t of ticketPayload) {
        const res = await apiFetch("/api/tickets/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: selectedEvent.id,
            name: t.name,
            price: t.price,
            quantity_total: t.quantity_total,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          Alert.alert("Ticket Error", data.detail || "Failed to create ticket.");
          setLoading(false);
          return;
        }
      }

      Alert.alert("Success", "Ticket types created successfully!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Create Ticket Type</Text>
      </View>

      {/* EVENT SELECT */}
      <Text style={styles.label}>Select Event</Text>

      {events.length === 0 ? (
        <Text style={{ color: "#777", marginTop: 10 }}>
          No events found. Create an event first.
        </Text>
      ) : (
        <View style={styles.eventBox}>
          {events.map((event) => (
            <Pressable
              key={event.id}
              style={[
                styles.eventItem,
                selectedEvent?.id === event.id && styles.eventActive,
              ]}
              onPress={() => setSelectedEvent(event)}
            >
              <Text
                style={[
                  styles.eventText,
                  selectedEvent?.id === event.id && styles.eventTextActive,
                ]}
              >
                {event.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* TICKETS */}
      <Text style={styles.label}>Ticket Types</Text>

      {tickets.map((t, index) => (
        <View key={index} style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Ticket {index + 1}</Text>

            {tickets.length > 1 && (
              <Pressable onPress={() => removeTicketRow(index)}>
                <Ionicons name="trash" size={20} color="#ff4d4d" />
              </Pressable>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Name (Regular / VIP / VVIP)"
            placeholderTextColor="#666"
            value={t.name}
            onChangeText={(v) => updateTicket(index, "name", v)}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Price (e.g. 5000)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={t.price}
              onChangeText={(v) => updateTicket(index, "price", v)}
            />

            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Qty (e.g. 200)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={t.quantity_total}
              onChangeText={(v) => updateTicket(index, "quantity_total", v)}
            />
          </View>
        </View>
      ))}

      <Pressable style={styles.addTicketBtn} onPress={addTicketRow}>
        <Ionicons name="add-circle" size={22} color="#000" />
        <Text style={styles.addTicketText}>Add Ticket Type</Text>
      </Pressable>

      {/* SUBMIT */}
      <Pressable
        style={styles.createBtn}
        onPress={submitTickets}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.createText}>Create Ticket Types</Text>
        )}
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

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
    marginBottom: 30,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 12,
  },

  label: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 18,
  },

  eventBox: {
    marginTop: 10,
  },

  eventItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 10,
  },

  eventActive: {
    backgroundColor: "#7CFF00",
    borderColor: "#7CFF00",
  },

  eventText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  eventTextActive: {
    color: "#000",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  ticketCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
  },

  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  ticketTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  addTicketBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 22,
    marginTop: 14,
  },

  addTicketText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },

  createBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 40,
  },

  createText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
});