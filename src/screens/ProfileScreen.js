import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }) {
  async function logout() {
    await AsyncStorage.removeItem("access");
    await AsyncStorage.removeItem("refresh");

    Alert.alert("Logged Out", "You have been logged out.");
    navigation.replace("Login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <Text style={styles.text}>You are logged in as a customer.</Text>

      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#7CFF00",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 14,
  },
  text: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  btnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});