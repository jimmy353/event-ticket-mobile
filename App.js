import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Platform } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

import * as Notifications from "expo-notifications";

// ⭐ This tells Expo to show banners when notifications arrive
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // shows banner
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {

    // ⭐ Android notification channel (required for banners)
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // When notification arrives
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });

    // When user taps notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification tapped:", response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };

  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}