import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ImageBackground,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiFetch, API_URL } from "../services/api";

const categories = [
  { label: "All", value: "all" },
  { label: "Music", value: "music" },
  { label: "Sports", value: "sports" },
  { label: "Nightlife", value: "nightlife" },
  { label: "Comedy", value: "comedy" },
  { label: "Lifeband", value: "liveband" },
  { label: "Culture", value: "culture" },
  { label: "Conference", value: "conference" },
  { label: "Other", value: "other" },
];

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await apiFetch(`/api/events/`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        console.log("❌ Events fetch failed:", data);
        setEvents([]);
        return;
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch error:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function getImageUrl(image) {
    if (!image) return null;

    if (image.startsWith("http://")) {
      return image.replace("http://", "https://");
    }

    return image.startsWith("http") ? image : `${API_URL}${image}`;
  }

  /* ================= FILTER LOGIC ================= */

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const upcomingEvents = filteredEvents.slice(0, 6);
  const trendingEvents = filteredEvents.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.small}>Welcome back,</Text>
          <Text style={styles.big}>Find Your Vibe</Text>
        </View>

        <Pressable
          style={styles.bell}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search events, artists..."
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CATEGORY FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 18 }}
      >
        {categories.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setSelectedCategory(item.value)}
            style={[
              styles.categoryBtn,
              selectedCategory === item.value && styles.categoryActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.value && styles.categoryTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* UPCOMING HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        <Pressable onPress={() => navigation.navigate("Events")}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7CFF00"
          style={{ marginTop: 30 }}
        />
      ) : (
        <>
          {/* UPCOMING */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upcomingEvents.map((event) => {
              const imageUrl = getImageUrl(event.image);

              return (
                <Pressable
                  key={event.id}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate("EventDetails", { event })}
                >
                  <ImageBackground
                    source={
                      imageUrl
                        ? { uri: imageUrl }
                        : require("../assets/default-event.png")
                    }
                    style={styles.upcomingImage}
                    imageStyle={{ borderRadius: 22 }}
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.95)"]}
                      style={styles.overlay}
                    />

                    <View style={styles.upcomingText}>
                      <Text style={styles.eventTitle}>{event.title}</Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaIcon}>📍</Text>
                        <Text style={styles.eventMeta}>
                          {event.location || "Location TBA"}
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaIcon}>🗓</Text>
                        <Text style={styles.eventMeta}>
                          {new Date(event.start_date).toDateString()}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* TRENDING */}
          <Text style={styles.trendingTitle}>Trending Now</Text>

          {trendingEvents.map((event) => {
            const imageUrl = getImageUrl(event.image);

            return (
              <Pressable
                key={event.id}
                style={styles.trendingCard}
                onPress={() => navigation.navigate("EventDetails", { event })}
              >
                <Image
                  source={
                    imageUrl
                      ? { uri: imageUrl }
                      : require("../assets/default-event.png")
                  }
                  style={styles.trendingImage}
                />

                <View style={styles.trendingText}>
                  <Text style={styles.trendingEventTitle}>{event.title}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>📍</Text>
                    <Text style={styles.eventMeta}>
                      {event.location || "Location TBA"}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>🗓</Text>
                    <Text style={styles.eventMeta}>
                      {new Date(event.start_date).toDateString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  small: {
    color: "#aaa",
    fontSize: 14,
  },

  big: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  bell: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  bellIcon: {
    fontSize: 20,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: "#777",
  },

  searchInput: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },

  categoryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  categoryActive: {
    backgroundColor: "#7CFF00",
    borderColor: "#7CFF00",
  },

  categoryText: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  categoryTextActive: {
    color: "#000",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  seeAll: {
    color: "#7CFF00",
    fontWeight: "bold",
  },

  upcomingCard: {
    width: 270,
    height: 190,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "#111",
  },

  upcomingImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },

  upcomingText: {
    padding: 14,
  },

  eventTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 8,
  },

  trendingTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 35,
    marginBottom: 14,
  },

  trendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  trendingImage: {
    width: 88,
    height: 88,
    borderRadius: 18,
    marginRight: 14,
  },

  trendingText: {
    flex: 1,
  },

  trendingEventTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  metaIcon: {
    marginRight: 6,
    fontSize: 13,
  },

  eventMeta: {
    color: "#aaa",
    fontSize: 13,
  },
});