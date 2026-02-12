import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import { apiFetch, safeJson } from "../services/api";

const { width } = Dimensions.get("window");

export default function MyTicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    fetchTickets();
  }, []);

  // 🔁 Refresh token
  const refreshToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem("refresh");
      if (!refresh) return null;

      const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      await AsyncStorage.setItem("access", data.access);

      return data.access;
    } catch (err) {
      console.log("❌ Refresh error:", err);
      return null;
    }
  };

  // ✅ Safe JSON reader
  const safeJson = async (res) => {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.log("❌ API returned non JSON:", text);
      return { error: "Server returned invalid response" };
    }
  };

  // 🎟️ FETCH TICKETS
  const fetchTickets = async () => {
  setLoading(true);

  try {
    const res = await apiFetch("/api/tickets/my/", { method: "GET" });
    const data = await safeJson(res);

    if (!res.ok) {
      Alert.alert("Error", data.detail || data.error || "Failed to load tickets");
      setTickets([]);
      setLoading(false);
      return;
    }

    setTickets(Array.isArray(data) ? data : []);
  } catch (err) {
    Alert.alert("Error", err.message);
  }

  setLoading(false);
};

  // 🎨 Ticket color by type
  const getTicketColor = (ticketName) => {
    const name = ticketName?.toLowerCase() || "";

    if (name.includes("vvip")) return "#FFD700"; // gold
    if (name.includes("vip")) return "#7CFF00"; // neon green
    if (name.includes("regular")) return "#00d4ff"; // cyan
    if (name.includes("table")) return "#ff00ff"; // purple

    return "#ffffff";
  };

  // 🕒 Format date
  const formatEventDate = (dateString) => {
    if (!dateString) return "Date not available";

    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🎟️ Upcoming / Past (simple)
  const upcomingTickets = tickets;
  const pastTickets = [];

  // 📥 Download Ticket Image
  const downloadTicket = async (ref) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Allow access to save ticket image.");
        return;
      }

      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert("Success", "Ticket saved to gallery 📸");
    } catch (err) {
      console.log("❌ Download error:", err);
      Alert.alert("Error", "Failed to save ticket");
    }
  };

  // 🎟️ Ticket Card
  const TicketCard = ({ item }) => {
    const ticketRef = useRef();

    return (
      <View style={styles.ticketWrapper}>
        <View ref={ticketRef} collapsable={false} style={styles.ticketCard}>
          {/* HEADER */}
          <View style={styles.ticketHeader}>
            <Text style={styles.eventTitle}>{item.event_title}</Text>
            <Text style={styles.eventDate}>
              {formatEventDate(item.event_start_date)}
            </Text>
          </View>

          {/* BODY */}
          <View style={styles.ticketBody}>
            {/* ROW 1 */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>LOCATION</Text>
                <Text style={styles.value}>
                  {item.event_location || "Not Available"}
                </Text>
              </View>

              <View style={styles.colRight}>
                <Text style={styles.label}>TICKET TYPE</Text>
                <View
                  style={[
                    styles.typeBadge,
                    { borderColor: getTicketColor(item.ticket_name) },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: getTicketColor(item.ticket_name) },
                    ]}
                  >
                    {item.ticket_name}
                  </Text>
                </View>
              </View>
            </View>

            {/* ROW 2 */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>PRICE</Text>
                <Text style={styles.value}>SSP {item.price}</Text>
              </View>

              <View style={styles.colRight}>
                <Text style={styles.label}>ORDER ID</Text>
                <Text style={styles.value}>{item.order_id || "N/A"}</Text>
              </View>
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* QR SECTION */}
            <View style={styles.qrBox}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${item.ticket_code}`,
                }}
                style={styles.qrImage}
              />
              <Text style={styles.qrText}>Scan this code at the entrance</Text>

              <View style={styles.bottomLine} />
            </View>
          </View>
        </View>

        {/* DOWNLOAD BUTTON */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => downloadTicket(ticketRef)}
        >
          <Text style={styles.downloadText}>Download Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // LOADING
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#fff", marginTop: 12 }}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TITLE */}
      <Text style={styles.pageTitle}>My Tickets</Text>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "upcoming" && styles.activeTab]}
          onPress={() => setTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === "past" && styles.activeTab]}
          onPress={() => setTab("past")}
        >
          <Text
            style={[styles.tabText, tab === "past" && styles.activeTabText]}
          >
            Past Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={tab === "upcoming" ? upcomingTickets : pastTickets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TicketCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tickets available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 18,
    paddingTop: 60,
  },

  pageTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 30,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#7CFF00",
  },

  tabText: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 15,
  },

  activeTabText: {
    color: "#000",
  },

  ticketWrapper: {
    marginBottom: 20,
  },

  ticketCard: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },

  ticketHeader: {
    backgroundColor: "#7CFF00",
    padding: 20,
  },

  eventTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },

  eventDate: {
    fontSize: 13,
    color: "#111",
    fontWeight: "700",
  },

  ticketBody: {
    padding: 18,
    backgroundColor: "#0c0c0c",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  col: {
    flex: 1,
  },

  colRight: {
    flex: 1,
    alignItems: "flex-end",
  },

  label: {
    fontSize: 11,
    color: "#777",
    marginBottom: 6,
    fontWeight: "bold",
  },

  value: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },

  typeBadge: {
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 22,
  },

  typeText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 16,
  },

  qrBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#222",
  },

  qrImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 14,
    backgroundColor: "#fff",
  },

  qrText: {
    marginTop: 14,
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },

  bottomLine: {
    height: 4,
    width: "40%",
    backgroundColor: "#7CFF00",
    borderRadius: 10,
    marginTop: 14,
  },

  downloadBtn: {
    marginTop: 12,
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  downloadText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#000",
  },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});