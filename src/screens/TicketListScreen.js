import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.146:8000";

export default function TicketListScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadTickets();
  }, []);

  async function refreshAccessToken() {
    try {
      const refresh = await AsyncStorage.getItem("refresh");

      if (!refresh) return null;

      // ✅ FIXED ENDPOINT
      const res = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) return null;

      const data = await res.json();

      if (data.access) {
        await AsyncStorage.setItem("access", data.access);
        return data.access;
      }

      return null;
    } catch (error) {
      console.log("Refresh token error:", error);
      return null;
    }
  }

  async function loadTickets() {
    try {
      let token = await AsyncStorage.getItem("access");

      let res = await fetch(`${API_URL}/api/tickets/?event=${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let text = await res.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        console.log("❌ Server returned HTML instead of JSON:", text);
        setTickets([]);
        return;
      }

      if (res.status === 401 || json?.code === "token_not_valid") {
        const newToken = await refreshAccessToken();

        if (!newToken) {
          navigation.replace("Login");
          return;
        }

        res = await fetch(`${API_URL}/api/tickets/?event=${eventId}`, {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });

        text = await res.text();

        try {
          json = JSON.parse(text);
        } catch {
          console.log("❌ Server returned HTML instead of JSON:", text);
          setTickets([]);
          return;
        }
      }

      setTickets(Array.isArray(json) ? json : []);
    } catch (e) {
      console.log("Ticket error:", e);
      setTickets([]);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🎫 Tickets</Text>

      {tickets.length === 0 && (
        <Text style={styles.empty}>No tickets available</Text>
      )}

      {tickets.map((t) => (
        <View key={t.id} style={styles.card}>
          <Text style={styles.name}>{t.name}</Text>

          <Text style={styles.price}>SSP {t.price}</Text>

          <Text style={styles.meta}>
            Available: {t.quantity_total - t.quantity_sold}
          </Text>

          <Pressable style={styles.buyBtn}>
            <Text style={styles.buyText}>Buy Ticket</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },

  header: {
    color: "#7CFF00",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  empty: { color: "#777", marginTop: 20 },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },

  name: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  price: { color: "#7CFF00", fontSize: 18, marginTop: 6 },

  meta: { color: "#aaa", marginTop: 4 },

  buyBtn: {
    marginTop: 14,
    backgroundColor: "#7CFF00",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buyText: { color: "#000", fontSize: 16, fontWeight: "bold" },
});