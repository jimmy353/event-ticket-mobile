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

export default function RefundUpdatesScreen({ navigation }) {

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  async function fetchRefunds() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/refunds/my/");
      const data = await safeJson(res);

      if (res.ok) {
        setRefunds(Array.isArray(data) ? data : []);
      }

    } catch (e) {
      console.log("Refund error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchRefunds();
    setRefreshing(false);
  }

  function renderItem({ item }) {

    let color = "#ffaa00";

    if (item.status === "approved") color = "#7CFF00";
    if (item.status === "rejected") color = "#ff4444";

    return (
      <View style={styles.card}>

        <Text style={styles.eventTitle}>
          {item.event_title}
        </Text>

        <Text style={[styles.status, { color }]}>
          {item.status.toUpperCase()}
        </Text>

        <Text style={styles.amount}>
          SSP {item.amount}
        </Text>

        <Text style={styles.date}>
          {formatDate(item.created_at)}
        </Text>

      </View>
    );
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
            <Text style={styles.title}>Refund Updates</Text>
            <Text style={styles.subtitle}>Your Refund History</Text>
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
            data={refunds}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            contentContainerStyle={{ padding: 16 }}
            renderItem={renderItem}
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

  status: {
    fontWeight: "bold",
    marginBottom: 6,
  },

  amount: {
    color: "#fff",
    marginBottom: 6,
  },

  date: {
    color: "#777",
    fontSize: 12,
  },

});