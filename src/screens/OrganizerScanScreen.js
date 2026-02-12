import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch, API_URL } from "../services/api";

const STORAGE_KEY = "SCAN_HISTORY";
const SCAN_LOCK_MS = 3000; // ⏱️ 3 seconds lock

export default function OrganizerScanScreen({ route, navigation }) {
  const eventId = route?.params?.eventId;
  const eventTitle = route?.params?.eventTitle || "Scan Tickets";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [history, setHistory] = useState([]);

  const lastScanRef = useRef({ code: null, time: 0 });

  /* ================= LOAD HISTORY ================= */

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) setHistory(JSON.parse(stored));
  };

  const saveHistory = async (data) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHistory(data);
  };

  /* ================= SOUNDS ================= */

  const playSound = async (file) => {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
  };

  /* ================= LIVE COUNTERS ================= */

  const stats = useMemo(() => {
    let valid = 0,
      invalid = 0,
      pending = 0;

    history.forEach((h) => {
      if (h.status === "VALID") valid++;
      else if (h.status === "INVALID") invalid++;
      else pending++;
    });

    return {
      valid,
      invalid,
      pending,
      total: history.length,
    };
  }, [history]);

  /* ================= CLEAR HISTORY ================= */

  const clearHistory = async () => {
    Alert.alert("Clear Scans", "Clear live scan list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setHistory([]);
        },
      },
    ]);
  };

  /* ================= HANDLE SCAN ================= */

  const handleScan = async ({ data }) => {
    const now = Date.now();

    // 🚫 Scan lock (same QR within 3 seconds)
    if (
      lastScanRef.current.code === data &&
      now - lastScanRef.current.time < SCAN_LOCK_MS
    ) {
      return;
    }

    lastScanRef.current = { code: data, time: now };

    if (scanned) return;
    setScanned(true);

    const entry = {
      id: now.toString(),
      code: data,
      time: new Date().toLocaleTimeString(),
      event: eventTitle,
      status: "PENDING",
    };

    let newHistory = [entry, ...history].slice(0, 50);
    await saveHistory(newHistory);

    try {
      const res = await apiFetch("/api/tickets/scan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_code: data,
          event_id: eventId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        await playSound(require("../assets/error.mp3"));
        newHistory[0].status = "INVALID";
      } else {
        await playSound(require("../assets/success.mp3"));
        newHistory[0].status = "VALID";
      }

      saveHistory(newHistory);
    } catch {
      newHistory[0].status = "PENDING";
      saveHistory(newHistory);
    }

    setTimeout(() => setScanned(false), 1500);
  };

  /* ================= PERMISSION ================= */

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        <Pressable onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!eventId) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Event not selected</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.btn}>
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{eventTitle}</Text>
          <Text style={styles.subtitle}>
            ✅ {stats.valid} | ❌ {stats.invalid} | ⏳ {stats.pending} | 📊{" "}
            {stats.total}
          </Text>
        </View>

        <Pressable onPress={clearHistory}>
          <Ionicons name="trash" size={22} color="#ff4d4d" />
        </Pressable>
      </View>

      <View style={styles.box} />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        style={styles.history}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.code}>{item.code.slice(0, 8)}…</Text>
            <Text style={styles[item.status.toLowerCase()]}>
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  header: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#7CFF00",
    fontSize: 12,
    marginTop: 2,
  },

  box: {
    alignSelf: "center",
    marginTop: 180,
    width: 260,
    height: 260,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#7CFF00",
  },

  history: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    marginBottom: 6,
  },

  code: { color: "#aaa" },

  valid: { color: "#7CFF00", fontWeight: "bold" },
  invalid: { color: "#ff4d4d", fontWeight: "bold" },
  pending: { color: "#ffaa00", fontWeight: "bold" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  text: { color: "#aaa", marginBottom: 12 },

  btn: {
    backgroundColor: "#7CFF00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  btnText: { color: "#000", fontWeight: "bold" },
});