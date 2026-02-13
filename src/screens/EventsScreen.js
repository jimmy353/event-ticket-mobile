import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { apiFetch } from "../services/api";

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await apiFetch("/api/events/", { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        console.log("❌ Events fetch failed:", data);
        setEvents([]);
        return;
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("❌ Fetch error:", err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }

  // ✅ FIX CLOUDINARY IMAGE URL
  function getImageUrl(image) {
    if (!image) return null;

    let fixed = image.replace("http://", "https://");

    // ✅ optimize cloudinary image (faster + smaller)
    if (fixed.includes("/upload/")) {
      fixed = fixed.replace("/upload/", "/upload/w_800,q_auto,f_auto/");
    }

    return fixed;
  }

  function renderItem({ item }) {
    const imageUrl = getImageUrl(item.image);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("EventDetails", { event: item })}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) =>
              console.log("❌ Image failed:", imageUrl, e.nativeEvent.error)
            }
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>NO IMAGE</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.meta}>📍 {item.location || "Location TBA"}</Text>

          <Text style={styles.meta}>
            🗓{" "}
            {item.start_date
              ? new Date(item.start_date).toDateString()
              : "Date TBA"}
          </Text>

          <View style={styles.viewBtn}>
            <Text style={styles.viewText}>VIEW DETAILS</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>All Events</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7CFF00"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7CFF00"
            />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  pageTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 60,
    marginBottom: 10,
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: "#0b0b0b",
    borderRadius: 18,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#111",
  },

  image: {
    width: "100%",
    height: 190,
    backgroundColor: "#111",
  },

  imagePlaceholder: {
    width: "100%",
    height: 190,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    color: "#7CFF00",
    fontWeight: "bold",
    letterSpacing: 2,
  },

  cardBody: {
    padding: 14,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  meta: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 4,
  },

  viewBtn: {
    marginTop: 12,
    backgroundColor: "#7CFF00",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  viewText: {
    color: "#000",
    fontWeight: "bold",
  },
});