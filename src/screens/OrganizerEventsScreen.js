import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";

import { apiFetch } from "../services/api";

export default function OrganizerEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);

    try {
      const res = await apiFetch("/api/events/my-events/");
      if (!res.ok) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.log("Load organizer events error:", error);
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Events</Text>

      {loading ? (
        <ActivityIndicator color="#7CFF00" size="large" />
      ) : (
        <ScrollView style={{ width: "100%" }}>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>
              No events found. Create an event first.
            </Text>
          ) : (
            events.map((event) => (
              <Pressable
                key={event.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("EventDetails", { eventId: event.id })
                }
              >
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {event.start_date} - {event.end_date}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <Pressable
        style={styles.btn}
        onPress={() => Alert.alert("Coming Soon", "Create Event screen soon")}
      >
        <Text style={styles.btnText}>Create Event</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyText: {
    color: "#aaa",
    marginTop: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventDate: {
    color: "#aaa",
    marginTop: 5,
    fontSize: 12,
  },
  btn: {
    backgroundColor: "#7CFF00",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15,
  },
  btnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});