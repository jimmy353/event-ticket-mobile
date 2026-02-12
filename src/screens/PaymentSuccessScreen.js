import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";

export default function PaymentSuccessScreen({ route, navigation }) {
  const { method, amount } = route.params || {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.icon}>✅</Text>

      <Text style={styles.title}>Payment Successful</Text>

      <Text style={styles.text}>
        Your payment via{" "}
        <Text style={styles.bold}>
          {method === "momo" ? "MTN MoMo" : "M-Gurush"}
        </Text>{" "}
        was successful.
      </Text>

      <Text style={styles.amount}>{amount}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          })
        }
      >
        <Text style={styles.buttonText}>Discover More Events</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  icon: {
    fontSize: 70,
    marginBottom: 20,
  },

  title: {
    color: "#7CFF00",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  text: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },

  bold: {
    color: "#fff",
    fontWeight: "bold",
  },

  amount: {
    color: "#7CFF00",
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 20,
  },

  button: {
    backgroundColor: "#7CFF00",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },

  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});