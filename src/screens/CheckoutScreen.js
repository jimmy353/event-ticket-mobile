import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, safeJson } from "../services/api";

export default function CheckoutScreen({ route, navigation }) {
  const { event, ticket, quantity } = route.params;

  const [selectedPayment, setSelectedPayment] = useState("mgurush");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // ================================
  // LOAD DEFAULT PAYMENT
  // ================================
  useEffect(() => {
    loadDefaultPayment();
  }, []);

  async function loadDefaultPayment() {
    try {
      const token = await AsyncStorage.getItem("access");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/payments/saved/default/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.phone) {
        setPhone(data.phone);
        detectProvider(data.phone);
      }

      if (data.provider) {
        setSelectedPayment(data.provider.toLowerCase());
      }
    } catch (err) {
      console.log("Default payment load error:", err);
    }
  }

  // ================================
  // AUTO DETECT PROVIDER
  // ================================
  function detectProvider(phoneNumber) {
    if (!phoneNumber) return;

    const prefix = phoneNumber.substring(0, 3);

    if (prefix === "092" || prefix === "092") {
      setSelectedPayment("momo");
    }

    if (prefix === "091" || prefix === "091") {
      setSelectedPayment("mgurush");
    }
  }

  // ================================
  // SAVE PAYMENT METHOD
  // ================================
  async function savePaymentMethod() {
    try {
      const token = await AsyncStorage.getItem("access");

      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/payments/saved/add/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider: selectedPayment.toUpperCase(),
            phone_number: phone,
          }),
        }
      );
    } catch (err) {
      console.log("Save payment method error:", err);
    }
  }

  // ================================
  // CREATE ORDER
  // ================================
  const createOrder = async () => {
    return apiFetch("/api/orders/create/", {
      method: "POST",
      body: JSON.stringify({
        event_id: event.id,
        ticket_id: ticket.id,
        quantity: quantity,
      }),
    });
  };

  // ================================
  // INITIATE PAYMENT
  // ================================
  const initiatePayment = async (orderId) => {
    return apiFetch("/api/payments/initiate/", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        provider: selectedPayment,
        phone: phone,
      }),
    });
  };

  // ================================
  // HANDLE PAYMENT
  // ================================
  const handlePay = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    setLoading(true);

    try {
      // CREATE ORDER
      const orderRes = await createOrder();
      const orderData = await safeJson(orderRes);

      if (orderData?.raw) {
        Alert.alert("Server Error", "Backend returned invalid response.");
        setLoading(false);
        return;
      }

      if (!orderRes.ok) {
        Alert.alert("Order Error", orderData.error || "Could not create order");
        setLoading(false);
        return;
      }

      const orderId = orderData.id;

      // INITIATE PAYMENT
      const payRes = await initiatePayment(orderId);
      const payData = await safeJson(payRes);

      if (payData?.raw) {
        Alert.alert("Server Error", "Backend returned invalid response.");
        setLoading(false);
        return;
      }

      if (!payRes.ok) {
        Alert.alert("Payment Error", payData.error || "Payment failed");
        setLoading(false);
        return;
      }

      // SAVE PAYMENT METHOD AUTOMATICALLY
      await savePaymentMethod();

      setLoading(false);

      navigation.replace("PaymentSuccess", {
        method: selectedPayment,
        amount: `SSP ${ticket.price * quantity}`,
        orderId: orderId,
      });

    } catch (err) {
      console.log("Checkout error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Checkout</Text>
              <Text style={styles.headerSubtitle}>Confirm & pay securely</Text>
            </View>
          </View>

          {/* ORDER CARD */}
          <View style={styles.card}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.subText}>{ticket.name}</Text>
            <Text style={styles.subText}>Quantity: {quantity}</Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>Total Amount</Text>
            <Text style={styles.amount}>
              SSP {ticket.price * quantity}
            </Text>
          </View>

          {/* PAYMENT METHOD */}
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedPayment === "momo" && styles.selected,
            ]}
            onPress={() => setSelectedPayment("momo")}
          >
            <Image source={require("../assets/momo.png")} style={styles.logo} />
            <Text style={styles.paymentText}>MTN MoMo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedPayment === "mgurush" && styles.selected,
            ]}
            onPress={() => setSelectedPayment("mgurush")}
          >
            <Image
              source={require("../assets/mgurush.png")}
              style={styles.logo}
            />
            <Text style={styles.paymentText}>M-Gurush</Text>
          </TouchableOpacity>

          {/* PHONE INPUT */}
          <Text style={styles.inputLabel}>
            {selectedPayment === "momo"
              ? "MTN MoMo Number"
              : "M-Gurush Number"}
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="0912345678"
            placeholderTextColor="#777"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              detectProvider(text);
            }}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {/* PAY BUTTON */}
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePay}
            disabled={loading}
          >
            <Text style={styles.payText}>
              {loading ? "Processing..." : "Pay Now"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },

  backArrow: { color: "#7CFF00", fontSize: 30, marginRight: 14 },

  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "bold" },

  headerSubtitle: { color: "#888", fontSize: 14 },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  eventTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  subText: { color: "#aaa", marginTop: 4 },

  divider: { height: 1, backgroundColor: "#222", marginVertical: 12 },

  amount: { color: "#7CFF00", fontSize: 26, fontWeight: "bold" },

  sectionTitle: {
    color: "#7CFF00",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "bold",
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  selected: { borderWidth: 2, borderColor: "#7CFF00" },

  logo: {
    width: 65,
    height: 40,
    resizeMode: "contain",
    backgroundColor: "#fff",
    borderRadius: 6,
    marginRight: 14,
  },

  paymentText: { color: "#fff", fontSize: 18, fontWeight: "600" },

  inputLabel: { color: "#aaa", marginBottom: 6 },

  input: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 25,
  },

  payButton: {
    backgroundColor: "#7CFF00",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },

  payText: { color: "#000", fontSize: 18, fontWeight: "bold" },
});