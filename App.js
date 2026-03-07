import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";

import * as Notifications from "expo-notifications";

export default function App() {

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {

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
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };

  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}