import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OrganizerWalletsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Organizer Wallets</Text>
      </View>

      <Text style={styles.text}>Coming soon: Wallet system here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginLeft: 12 },
  text: { color: "#aaa", fontSize: 16 },
});