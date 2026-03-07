import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RefundUpdatesScreen({ navigation }) {

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRefunds();
  }, []);

  async function loadRefunds() {
    try {

      const token = await AsyncStorage.getItem("access");

      const res = await fetch(`${API_URL}/api/refunds/my/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setRefunds(data);
      setLoading(false);

    } catch (error) {
      console.log("Refund error:", error);
      setLoading(false);
    }
  }

  function renderItem({ item }) {

    let color = "#ffaa00";

    if (item.status === "approved") color = "#00ff88";
    if (item.status === "rejected") color = "#ff4444";

    return (
      <View style={styles.card}>

        <Text style={styles.event}>
          {item.event_title}
        </Text>

        <Text style={[styles.status, { color }]}>
          {item.status.toUpperCase()}
        </Text>

        <Text style={styles.amount}>
          SSP {item.amount}
        </Text>

        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>

      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <FlatList
      data={refunds}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 15 }}
    />
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  event: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },

  status: {
    marginTop: 5,
    fontWeight: "bold",
  },

  amount: {
    marginTop: 5,
    color: "#ccc",
  },

  date: {
    marginTop: 5,
    color: "#888",
    fontSize: 12,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

});