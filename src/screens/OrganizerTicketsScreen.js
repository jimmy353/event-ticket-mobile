import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function OrganizerTicketsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organizer Tickets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#7CFF00",
    fontSize: 22,
    fontWeight: "bold",
  },
});