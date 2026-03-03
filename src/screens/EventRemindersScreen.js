import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiFetch, safeJson } from "../services/api";

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function countdown(date) {
  const diff = new Date(date) - new Date();
  if (diff <= 0) return "Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return `${days}d ${hours}h remaining`;
}

export default function EventRemindersScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders/upcoming/");
      const data = await safeJson(res);

      if (res.ok) {
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#000", "#050505", "#0a0a0a"]}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Event Reminders</Text>
            <Text style={styles.subtitle}>Upcoming Events</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#7CFF00"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.event_title}</Text>

                <Text style={styles.info}>
                  {formatDate(item.event_start_date)}
                </Text>

                <Text style={styles.location}>
                  📍 {item.location}
                </Text>

                <View style={styles.countdownBox}>
                  <Text style={styles.countdown}>
                    {countdown(item.event_start_date)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  back: {
    color: "#7CFF00",
    marginBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#7CFF00",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#222",
  },

  eventTitle: {
    color: "#7CFF00",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    color: "#fff",
    marginBottom: 6,
  },

  location: {
    color: "#777",
    marginBottom: 12,
  },

  countdownBox: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  countdown: {
    color: "#FFD60A",
    fontWeight: "bold",
  },
});