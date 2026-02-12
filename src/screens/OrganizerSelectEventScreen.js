import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, API_BASE_URL } from "../services/api";

export default function OrganizerSelectEventScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/api/events/organizer/");
      const data = await res.json();

      if (res.ok) {
        setEvents(data);
      } else {
        console.log("❌ Organizer events error:", data);
        setEvents([]);
      }
    } catch (err) {
      console.log("❌ Network error:", err.message);
      setEvents([]);
    }

    setLoading(false);
  };

  /* ================= IMAGE HELPER ================= */

  const getEventImage = (image) => {
    if (!image) {
      return require("../assets/default-event.png");
    }

    // If already absolute URL
    if (image.startsWith("http")) {
      return { uri: image };
    }

    // Backend-relative path → make absolute
    return { uri: `${API_BASE_URL}${image}` };
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={styles.text}>Loading events...</Text>
      </View>
    );
  }

  /* ================= EMPTY ================= */

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No events found</Text>

        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Select Event</Text>
          <Text style={styles.headerSub}>
            Choose an event to scan tickets
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{events.length}</Text>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => {
          const isLive =
            new Date(item.start_date) <= new Date() &&
            new Date(item.end_date) >= new Date();

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("OrganizerScan", {
                  eventId: item.id,
                  eventTitle: item.title,
                })
              }
            >
              <Image
                source={getEventImage(item.image)}
                style={styles.image}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardSub}>{item.location}</Text>
                <Text style={styles.cardSub}>
                  {new Date(item.start_date).toDateString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isLive ? "#1f6f1f" : "#0d3b66" },
                ]}
              >
                <Text style={styles.statusText}>
                  {isLive ? "LIVE" : "UPCOMING"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#7CFF00"
                style={{ marginLeft: 6 }}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 55,
    marginBottom: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  headerSub: {
    color: "#7CFF00",
    fontSize: 13,
    marginTop: 2,
  },

  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1f6f1f",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  image: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  cardSub: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: "#aaa",
    marginTop: 12,
  },

  btn: {
    backgroundColor: "#7CFF00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },

  btnText: {
    color: "#000",
    fontWeight: "bold",
  },
});