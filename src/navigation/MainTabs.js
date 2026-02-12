import React, { useState, useCallback } from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import HomeScreen from "../screens/HomeScreen";
import MyTicketsScreen from "../screens/MyTicketsScreen";
import OrganizerHubScreen from "../screens/OrganizerHubScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import OrganizerSelectEventScreen from "../screens/OrganizerSelectEventScreen";

import { apiFetch, safeJson } from "../services/api"; // ✅ FIXED

const Tab = createBottomTabNavigator();

function GlassTabBarBackground() {
  return <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />;
}

export default function MainTabs() {
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  async function loadProfile() {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access");

      if (!token) {
        setIsOrganizer(false);
        setLoading(false);
        return;
      }

      const res = await apiFetch("/api/auth/profile/", {
        method: "GET",
      });

      const data = await safeJson(res);

      if (data?.raw) {
        console.log("❌ Profile returned HTML:", data.raw);
        setIsOrganizer(false);
        setLoading(false);
        return;
      }

      if (res.ok) {
        setIsOrganizer(data.is_organizer === true);
      } else {
        console.log("❌ Profile error:", data);
        setIsOrganizer(false);
      }
    } catch (err) {
      console.log("❌ Profile load error:", err.message);
      setIsOrganizer(false);
    }

    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7CFF00" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: "#7CFF00",
        tabBarInactiveTintColor: "#777",

        tabBarIcon: ({ focused, color }) => {
          let iconName = "home";

          if (route.name === "Discover") {
            iconName = focused ? "compass" : "compass-outline";
          }

          if (route.name === "MyTickets") {
            iconName = focused ? "ticket" : "ticket-outline";
          }

          if (route.name === "MyOrders") {
            iconName = focused ? "cart" : "cart-outline";
          }

          if (route.name === "OrganizerHub") {
            iconName = focused ? "settings" : "settings-outline";
          }

          if (route.name === "ScanTickets") {
            iconName = focused ? "qr-code" : "qr-code-outline";
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />

      {isOrganizer ? (
        <Tab.Screen
          name="ScanTickets"
          component={OrganizerSelectEventScreen}
          options={{ title: "Scan Tickets" }}
        />
      ) : (
        <Tab.Screen
          name="MyTickets"
          component={MyTicketsScreen}
          options={{ title: "My Tickets" }}
        />
      )}

      {isOrganizer ? (
        <Tab.Screen
          name="OrganizerHub"
          component={OrganizerHubScreen}
          options={{ title: "Organizer Hub" }}
        />
      ) : (
        <Tab.Screen
          name="MyOrders"
          component={MyOrdersScreen}
          options={{ title: "My Orders" }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    height: 75,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingBottom: 12,
    paddingTop: 10,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});