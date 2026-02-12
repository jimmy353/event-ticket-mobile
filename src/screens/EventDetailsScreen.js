import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";

import { apiFetch, API_URL } from "../services/api";

/* ✅ format time */
function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      console.log(
        "📌 Fetching Tickets URL:",
        `${API_URL}/api/tickets/?event=${event.id}`
      );

      const res = await apiFetch(`/api/tickets/?event=${event.id}`, {
        method: "GET",
      });

      const data = await res.json();

      console.log("✅ Tickets API Response:", data);

      if (!res.ok) {
        console.log("❌ Ticket fetch failed:", data);
        setTickets([]);
        return;
      }

      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("❌ Ticket fetch error:", error.message);

      if (error.message.includes("Session expired")) {
        navigation.replace("Login");
      }

      setTickets([]);
    }
  }

  const total = selectedTicket ? selectedTicket.price * quantity : 0;

  const imageUrl =
    event?.image?.startsWith("http")
      ? event.image
      : event?.image
      ? `${API_URL}${event.image}`
      : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER (ABSOLUTE) */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}

        <View style={styles.section}>
          <Text style={styles.title}>{event.title}</Text>

          <Text style={styles.meta}>📍 {event.location}</Text>

          <Text style={styles.meta}>
            🗓 {new Date(event.start_date).toDateString()}
          </Text>

          <Text style={styles.meta}>
            ⏰ {formatTime(event.start_date)} – {formatTime(event.end_date)}
          </Text>

          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tickets</Text>

          {tickets.length === 0 && (
            <Text style={{ color: "#777", marginTop: 10 }}>
              No tickets available
            </Text>
          )}

          {tickets.map((ticket) => {
            const isSelected = selectedTicket?.id === ticket.id;

            const available =
              Number(ticket.quantity_total) - Number(ticket.quantity_sold);

            return (
              <View key={ticket.id} style={styles.ticketRow}>
                <View>
                  <Text style={styles.ticketName}>{ticket.name}</Text>
                  <Text style={styles.ticketPrice}>SSP {ticket.price}</Text>
                  <Text style={styles.available}>Available: {available}</Text>
                </View>

                {isSelected ? (
                  <View style={styles.qtyBox}>
                    <Pressable
                      onPress={() => {
                        if (quantity === 1) {
                          setSelectedTicket(null);
                        } else {
                          setQuantity((q) => q - 1);
                        }
                      }}
                    >
                      <Text style={styles.qtyBtn}>−</Text>
                    </Pressable>

                    <Text style={styles.qty}>{quantity}</Text>

                    <Pressable
                      onPress={() => {
                        if (quantity >= available) {
                          Alert.alert(
                            "Not Available",
                            "You cannot buy more than available tickets."
                          );
                          return;
                        }

                        setQuantity((q) => q + 1);
                      }}
                    >
                      <Text style={styles.qtyBtn}>+</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setSelectedTicket(ticket);
                      setQuantity(1);
                    }}
                  >
                    <Text style={styles.selectText}>Select</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {selectedTicket && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>SSP {total}</Text>
          </View>

          <Pressable
            style={styles.buyBtn}
            onPress={() =>
              navigation.navigate("Checkout", {
                event,
                ticket: selectedTicket,
                quantity,
              })
            }
          >
            <Text style={styles.buyText}>Buy Ticket</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  back: {
    color: "#7CFF00",
    fontSize: 28,
    marginRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  image: {
    width: "100%",
    height: 260,
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  meta: {
    color: "#aaa",
    marginTop: 6,
  },
  description: {
    color: "#ccc",
    marginTop: 12,
  },

  sectionTitle: {
    color: "#7CFF00",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 16,
  },

  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  ticketName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ticketPrice: {
    color: "#7CFF00",
    marginTop: 4,
  },
  available: {
    color: "#777",
    marginTop: 4,
  },

  selectText: {
    color: "#7CFF00",
    fontWeight: "bold",
    fontSize: 16,
  },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  qtyBtn: {
    color: "#7CFF00",
    fontSize: 22,
    paddingHorizontal: 10,
  },
  qty: {
    color: "#fff",
    fontWeight: "bold",
  },

  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#aaa",
  },
  totalValue: {
    color: "#7CFF00",
    fontSize: 22,
    fontWeight: "bold",
  },
  buyBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
  },
  buyText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});