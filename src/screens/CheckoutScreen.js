import React, { useState } from "react";
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

import { apiFetch, safeJson } from "../services/api";

export default function CheckoutScreen({ route, navigation }) {
  const { event, ticket, quantity } = route.params;

  const [selectedPayment, setSelectedPayment] = useState("mgurush");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // 🛒 CREATE ORDER
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

  // 💳 INITIATE PAYMENT
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

  const handlePay = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ CREATE ORDER
      const orderRes = await createOrder();
      const orderData = await safeJson(orderRes);

      if (orderData?.raw) {
        console.log("❌ Order create returned HTML:", orderData.raw);
        Alert.alert("Server Error", "Backend returned invalid response.");
        setLoading(false);
        return;
      }

      if (!orderRes.ok) {
        console.log("❌ Order create error:", orderData);
        Alert.alert("Order Error", orderData.error || "Could not create order");
        setLoading(false);
        return;
      }

      const orderId = orderData.id;

      // 2️⃣ INITIATE PAYMENT
      const payRes = await initiatePayment(orderId);
      const payData = await safeJson(payRes);

      if (payData?.raw) {
        console.log("❌ Payment returned HTML:", payData.raw);
        Alert.alert("Server Error", "Backend returned invalid response.");
        setLoading(false);
        return;
      }

      if (!payRes.ok) {
        console.log("❌ Payment error:", payData);
        Alert.alert("Payment Error", payData.error || "Payment failed");
        setLoading(false);
        return;
      }

      setLoading(false);

      navigation.replace("PaymentSuccess", {
        method: selectedPayment,
        amount: `SSP ${ticket.price * quantity}`,
        orderId: orderId,
      });
    } catch (err) {
      console.log("❌ Checkout error:", err);
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Checkout</Text>
              <Text style={styles.headerSubtitle}>Confirm & pay securely</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.subText}>{ticket.name}</Text>
            <Text style={styles.subText}>Quantity: {quantity}</Text>
            <View style={styles.divider} />
            <Text style={styles.subText}>Total Amount</Text>
            <Text style={styles.amount}>SSP {ticket.price * quantity}</Text>
          </View>

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

          <Text style={styles.inputLabel}>
            {selectedPayment === "momo" ? "MTN MoMo Number" : "M-Gurush Number"}
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="0912345678"
            placeholderTextColor="#777"
            value={phone}
            onChangeText={setPhone}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

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