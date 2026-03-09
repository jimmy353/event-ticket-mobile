import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function SavedPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);

  const loadPayments = async () => {
    try {
      const token = await AsyncStorage.getItem("access");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/payments/saved/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Load payments error:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#7CFF00" />
      </Pressable>

      <Text style={styles.title}>Saved Payment Methods</Text>

      {payments.length === 0 ? (
        <View style={styles.card}>
          <Ionicons name="phone-portrait-outline" size={22} color="#7CFF00" />
          <Text style={styles.text}>No saved MoMo numbers yet</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Ionicons name="phone-portrait-outline" size={22} color="#7CFF00" />
              <View style={{ flex: 1 }}>
                <Text style={styles.number}>{item.phone_number}</Text>
                <Text style={styles.provider}>
                  {item.provider} {item.is_default ? "• Default" : ""}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AddPaymentMethod")}
      >
        <Text style={styles.buttonText}>Add MoMo Number</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    paddingTop: 70,
  },

  back: {
    position: "absolute",
    top: 40,
    left: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#7CFF00",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  text: {
    color: "#ccc",
    fontSize: 15,
  },

  number: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  provider: {
    color: "#777",
    fontSize: 13,
    marginTop: 3,
  },

  button: {
    backgroundColor: "#7CFF00",
    marginTop: 20,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});