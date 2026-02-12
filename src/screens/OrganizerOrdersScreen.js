import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, API_URL } from "../services/api";

export default function OrganizerOrdersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const formatMoney = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("en-US");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);

    try {
      const res = await apiFetch("/api/orders/organizer/");

      const data = await res.json();

      if (!res.ok) {
        console.log("❌ Organizer Orders Error:", data);
        Alert.alert("Error", data.detail || "Failed to load orders");
        setLoading(false);
        return;
      }

      setOrders(data);
    } catch (err) {
      console.log("❌ Organizer Orders Exception:", err.message);
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
        <Text style={{ color: "#aaa", marginTop: 12 }}>Loading Orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.title}>Organizer Orders</Text>
      </View>

      {orders.length === 0 ? (
        <Text style={styles.empty}>No orders yet.</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>Order #{order.id}</Text>

            <Text style={styles.row}>
              <Text style={styles.label}>Total:</Text> SSP {formatMoney(order.total_amount)}
            </Text>

            <Text style={styles.row}>
              <Text style={styles.label}>Organizer:</Text> SSP{" "}
              {formatMoney(order.organizer_amount)}
            </Text>

            <Text style={styles.row}>
              <Text style={styles.label}>Commission:</Text> SSP{" "}
              {formatMoney(order.commission_amount)}
            </Text>

            <Text style={styles.row}>
              <Text style={styles.label}>Status:</Text> {order.status}
            </Text>
          </View>
        ))
      )}
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

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 14,
  },

  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    color: "#ddd",
    fontSize: 14,
    marginBottom: 6,
  },

  label: {
    color: "#aaa",
    fontWeight: "700",
  },
});