import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiFetch } from "../services/api";

const { width, height } = Dimensions.get("window");

/* ===========================
   ADVANCED HEART ENGINE
=========================== */

function Heart({ tapSignal }) {
  const posX = useRef(new Animated.Value(Math.random() * width)).current;
  const posY = useRef(new Animated.Value(Math.random() * height)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const isNeon = Math.random() < 0.25;
  const size = 18 + Math.random() * 28;

  useEffect(() => {
    if (Math.random() < 0.33) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(posX, {
              toValue: width,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(posY, {
              toValue: height,
              duration: 12000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(posX, {
              toValue: 0,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(posY, {
              toValue: 0,
              duration: 12000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else if (Math.random() < 0.66) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(posX, {
              toValue: width / 2,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(posY, {
              toValue: height / 2,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(posX, {
              toValue: Math.random() * width,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(posY, {
              toValue: Math.random() * height,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      Animated.loop(
        Animated.sequence([
          Animated.timing(posX, {
            toValue: Math.random() * width,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(posY, {
            toValue: Math.random() * height,
            duration: 10000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (tapSignal) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [tapSignal]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.Text
      style={{
        position: "absolute",
        fontSize: size,
        transform: [
          { translateX: posX },
          { translateY: posY },
          { scale },
          { rotate: spin },
        ],
        color: isNeon ? "#7CFF00" : "#888",
        textShadowColor: isNeon ? "#7CFF00" : "transparent",
        textShadowRadius: isNeon ? 14 : 0,
        opacity: 0.6,
      }}
    >
      🩶
    </Animated.Text>
  );
}

function FloatingHearts({ tapSignal }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 24 }).map((_, i) => (
        <Heart key={i} tapSignal={tapSignal} />
      ))}
    </View>
  );
}

/* ===========================
   REGISTER SCREEN
=========================== */

export default function RegisterScreen({ navigation }) {
  const [tapSignal, setTapSignal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const cardAnim = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, {
          toValue: 1.04,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(zoom, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !password2 || !phone) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== password2) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
          password2,
          role: "customer",
        }),
      });

      if (!res.ok) {
        Alert.alert("Register Failed");
        setLoading(false);
        return;
      }

      Alert.alert("Account Created ✅", "OTP sent to your email.");
      navigation.reset({
        index: 0,
        routes: [{ name: "VerifyOTP", params: { email } }],
      });
    } catch {
      Alert.alert("Error", "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={() => setTapSignal(!tapSignal)}>
      <Animated.View style={{ flex: 1, transform: [{ scale: zoom }] }}>
        <LinearGradient
          colors={["#000000", "#040404", "#0a0a0a"]}
          style={StyleSheet.absoluteFill}
        />

        <FloatingHearts tapSignal={tapSignal} />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.brand}>Sirheart Events</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <Animated.View style={[styles.card, { opacity: cardAnim }]}>
            <TextInput placeholder="Full Name" placeholderTextColor="#666" style={styles.input} value={fullName} onChangeText={setFullName} />
            <TextInput placeholder="Email" placeholderTextColor="#666" style={styles.input} value={email} onChangeText={setEmail} />
            <TextInput placeholder="Phone Number" placeholderTextColor="#666" style={styles.input} value={phone} onChangeText={setPhone} />
            <TextInput placeholder="Password" placeholderTextColor="#666" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput placeholder="Confirm Password" placeholderTextColor="#666" style={styles.input} secureTextEntry value={password2} onChangeText={setPassword2} />

            <Pressable style={styles.button} onPress={handleRegister}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 100, paddingBottom: 40 },
  brand: { color: "#7CFF00", fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 6 },
  subtitle: { color: "#aaa", textAlign: "center", marginBottom: 40 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 26, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  input: { height: 55, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, paddingHorizontal: 18, marginBottom: 16, color: "#fff", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  button: { backgroundColor: "#7CFF00", height: 58, borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: 10 },
  buttonText: { fontSize: 18, fontWeight: "bold", color: "#000" },
});