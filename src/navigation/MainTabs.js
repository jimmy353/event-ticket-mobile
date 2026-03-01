import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import MyTicketsScreen from "../screens/MyTicketsScreen";
import AccountScreen from "../screens/AccountScreen"; // ✅ replaced MyOrders

const Tab = createBottomTabNavigator();

function GlassTabBarBackground() {
  return (
    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
  );
}

export default function MainTabs() {
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

          if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ title: "My Tickets" }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: "Account" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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