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

import OrganizerPayoutsScreen from "../screens/OrganizerPayoutsScreen";
import OrganizerSelectEventScreen from "../screens/OrganizerSelectEventScreen";
import OrganizerScanScreen from "../screens/OrganizerScanScreen";
import OrganizerRefundsScreen from "../screens/OrganizerRefundsScreen";

import OrganizerEventsScreen from "../screens/OrganizerEventsScreen";
import OrganizerTicketsScreen from "../screens/OrganizerTicketsScreen";
import OrganizerPaymentsScreen from "../screens/OrganizerPaymentsScreen";
import OrganizerWalletsScreen from "../screens/OrganizerWalletsScreen";
import OrganizerMyAccountScreen from "../screens/OrganizerMyAccountScreen";

import RefundRequestScreen from "../screens/RefundRequestScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";

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

      {/* MAIN */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* EVENTS */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="TicketList" component={TicketListScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />

      {/* USER */}
      <Stack.Screen name="RefundRequest" component={RefundRequestScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />

      {/* ORGANIZER MODULES */}
     
      <Stack.Screen
        name="OrganizerPayments"
        component={OrganizerPaymentsScreen}
      />
      <Stack.Screen name="OrganizerPayouts" component={OrganizerPayoutsScreen} />
      <Stack.Screen name="OrganizerRefunds" component={OrganizerRefundsScreen} />
      <Stack.Screen name="OrganizerWallets" component={OrganizerWalletsScreen} />
      <Stack.Screen
        name="OrganizerMyAccount"
        component={OrganizerMyAccountScreen}
      />

      {/* SCAN */}
      <Stack.Screen
        name="OrganizerSelectEvent"
        component={OrganizerSelectEventScreen}
      />
      <Stack.Screen name="OrganizerScan" component={OrganizerScanScreen} />
    </Stack.Navigator>
  );
}