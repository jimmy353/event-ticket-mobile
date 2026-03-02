import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabs from "./MainTabs";

import EventsScreen from "../screens/EventsScreen";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import TicketListScreen from "../screens/TicketListScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import PaymentSuccessScreen from "../screens/PaymentSuccessScreen";

import RefundRequestScreen from "../screens/RefundRequestScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyOTPScreen from "../screens/VerifyOTPScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");

  useEffect(() => {
    checkLogin();
  }, []);

  async function checkLogin() {
    try {
      const token = await AsyncStorage.getItem("access");

      if (token) {
        setInitialRoute("MainTabs");
      } else {
        setInitialRoute("Login");
      }
    } catch (error) {
      console.log("Login check error:", error);
      setInitialRoute("Login");
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#7CFF00" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      {/* AUTH */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

      {/* MAIN */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* EVENTS */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="TicketList" component={TicketListScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* USER */}
      <Stack.Screen name="RefundRequest" component={RefundRequestScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }}
      
/>
    </Stack.Navigator>
  );
}