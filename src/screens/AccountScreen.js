import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function AccountScreen({ navigation }) {
  const logout = async () => {
    await AsyncStorage.removeItem("access");
    await AsyncStorage.removeItem("refresh");
    await AsyncStorage.removeItem("role");

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const Item = ({ icon, title, onPress }) => (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={20} color="#7CFF00" />
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 140 }} // ✅ push above tab bar
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}
      <LinearGradient
        colors={["#0f0f0f", "#151515", "#1b1b1b"]}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={38} color="#000" />
        </View>

        <Text style={styles.name}>Sirheart Events</Text>
        <Text style={styles.email}>Premium Member</Text>
      </LinearGradient>

      {/* ================= ACCOUNT ================= */}
      <Section title="Account">
        <Item
          icon="person-outline"
          title="View Profile"
          onPress={() => navigation.navigate("Profile")}
        />
        <Item
          icon="cart-outline"
          title="My Orders"
          onPress={() => navigation.navigate("MyOrders")}
        />
      </Section>

      {/* ================= NOTIFICATIONS ================= */}
      <Section title="Notifications">
        <Item
          icon="notifications-outline"
          title="Event Reminders"
          onPress={() => Alert.alert("Coming Soon")}
        />
        <Item
          icon="refresh-outline"
          title="Refund Updates"
          onPress={() => Alert.alert("Coming Soon")}
        />
        <Item
          icon="card-outline"
          title="Payment Confirmation"
          onPress={() => Alert.alert("Coming Soon")}
        />
      </Section>

      {/* ================= PAYMENTS ================= */}
      <Section title="Payments">
        <Item
          icon="card-outline"
          title="Saved Payment Methods"
          onPress={() => Alert.alert("Coming Soon")}
        />
        <Item
          icon="phone-portrait-outline"
          title="Default Provider (MoMo / M-Gurush)"
          onPress={() => Alert.alert("Coming Soon")}
        />
      </Section>

      {/* ================= TICKETS ================= */}
      <Section title="Tickets">
        <Item
          icon="ticket-outline"
          title="My Tickets"
          onPress={() => navigation.navigate("MyTickets")}
        />
        <Item
          icon="reload-outline"
          title="Refund History"
          onPress={() => Alert.alert("Coming Soon")}
        />
      </Section>

      {/* ================= SECURITY ================= */}
      <Section title="Security">
        <Item
          icon="shield-checkmark-outline"
          title="Two-Factor Auth (Future)"
          onPress={() => Alert.alert("Coming Soon")}
        />
        <Item
          icon="desktop-outline"
          title="Active Sessions"
          onPress={() => Alert.alert("Coming Soon")}
        />
      </Section>

      {/* ================= APP ================= */}
      <Section title="App">
        <Item
          icon="moon-outline"
          title="Dark Mode"
          onPress={() => Alert.alert("Already Enabled 😎")}
        />
        <Item
          icon="language-outline"
          title="Language"
          onPress={() => Alert.alert("Coming Soon")}
        />
        <Item
          icon="information-circle-outline"
          title="About"
          onPress={() => Alert.alert("Sirheart Events v1.0")}
        />
        <Item
          icon="document-text-outline"
          title="Terms & Privacy"
          onPress={() => Alert.alert("Coming Soon")}
        />
      </Section>

      {/* ================= LOGOUT ================= */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#7CFF00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  email: {
    color: "#888",
    fontSize: 14,
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  sectionTitle: {
    color: "#7CFF00",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itemText: {
    color: "#fff",
    fontSize: 15,
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: "#E50914", // 🔴 RED
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});