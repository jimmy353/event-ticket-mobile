import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const mockNotifications = [
  {
    id: "1",
    title: "Ticket Confirmed 🎟️",
    message: "Your ticket for Young Boy Live in Juba is confirmed.",
    time: "2 mins ago",
    unread: true,
  },
  {
    id: "2",
    title: "Event Reminder 🔔",
    message: "Don't forget your event this Saturday at Pyramid Hotel.",
    time: "1 hour ago",
    unread: false,
  },
  {
    id: "3",
    title: "Payment Successful 💳",
    message: "Your payment of $50 has been processed successfully.",
    time: "Yesterday",
    unread: false,
  },
];

export default function NotificationsScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderItem = ({ item }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>

        {item.unread && <View style={styles.unreadDot} />}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#000000", "#040404", "#0a0a0a"]}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#7CFF00" />
        </Pressable>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* LIST */}
      {mockNotifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-off-outline" size={60} color="#555" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={mockNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  headerTitle: {
    color: "#7CFF00",
    fontSize: 22,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  cardMessage: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },

  cardTime: {
    color: "#666",
    fontSize: 12,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7CFF00",
    marginLeft: 10,
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#666",
    marginTop: 12,
    fontSize: 16,
  },
});