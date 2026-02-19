import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, safeJson } from "../services/api";

export default function OrganizerPaymentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPayments(selectedEvent.id);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/events/");
      const data = await safeJson(res);

      if (res.ok) {
        setEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      }
    } catch (e) {
      console.log("Events error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(eventId) {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/payments/organizer/?event=${eventId}`);
      const data = await safeJson(res);

      if (res.ok) {
        setPayments(data);
      }
    } catch (e) {
      console.log("Payments error:", e);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
  const totalOrganizer = payments.reduce((sum, p) => sum + p.organizer_amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#7CFF00" />
        </Pressable>
        <Text style={styles.title}>Organizer Payments</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* EVENT SELECTOR */}
      <Pressable
        style={styles.eventSelector}
        onPress={() => setShowEventPicker(true)}
      >
        <Text style={styles.eventText}>
          {selectedEvent ? selectedEvent.title : "Select Event"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#7CFF00" />
      </Pressable>

      {/* SUMMARY */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Revenue Summary</Text>

        <Text style={styles.summaryItem}>
          Total Revenue: SSP {totalRevenue.toFixed(2)}
        </Text>

        <Text style={styles.summaryItemRed}>
          Commission: SSP {totalCommission.toFixed(2)}
        </Text>

        <Text style={styles.summaryItemGreen}>
          Organizer Earnings: SSP {totalOrganizer.toFixed(2)}
        </Text>
      </View>

      {/* PAYMENTS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CFF00" />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 60 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.amount}>SSP {item.amount}</Text>
              <Text style={styles.provider}>{item.provider.toUpperCase()}</Text>
              <Text style={styles.small}>
                Ticket: {item.ticket_type_name}
              </Text>
              <Text style={styles.small}>
                Customer: {item.customer_email}
              </Text>
            </View>
          )}
        />
      )}

      {/* EVENT PICKER MODAL */}
      <Modal visible={showEventPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.eventOption}
                  onPress={() => {
                    setSelectedEvent(item);
                    setShowEventPicker(false);
                  }}
                >
                  <Text style={{ color: "#fff" }}>{item.title}</Text>
                </Pressable>
              )}
            />

            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowEventPicker(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}