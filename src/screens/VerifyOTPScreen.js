import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import { apiFetch, safeJson } from "../services/api";

export default function VerifyOTPScreen({ route, navigation }) {
  const emailFromRoute = route?.params?.email || "";

  const [email, setEmail] = useState(emailFromRoute);

  // OTP digits
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");

  const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Timer state
  const [timer, setTimer] = useState(60);

  // refs for auto focus
  const ref2 = useRef();
  const ref3 = useRef();
  const ref4 = useRef();
  const ref5 = useRef();
  const ref6 = useRef();

  // ==========================
  // COUNTDOWN TIMER
  // ==========================
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ==========================
  // VERIFY OTP
  // ==========================
  const handleVerifyOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Email is required");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Error", "OTP must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/verify-otp/", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        console.log("❌ VERIFY OTP RESPONSE NOT JSON:", data.raw);
        Alert.alert("Server Error", "Backend returned invalid response");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        let message = "OTP verification failed";

        if (data?.detail) message = data.detail;
        else if (data?.error) message = data.error;
        else if (typeof data === "object") {
          message = Object.entries(data)
            .map(([key, value]) => {
              if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
              return `${key}: ${value}`;
            })
            .join("\n");
        }

        Alert.alert("Verify Failed", message);
        setLoading(false);
        return;
      }

      Alert.alert("Verified ✅", "Email verified successfully. You can now login.");

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.log("❌ Verify OTP error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }

    setLoading(false);
  };

  // ==========================
  // RESEND OTP
  // ==========================
  const handleResendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Email is required");
      return;
    }

    if (timer > 0) {
      Alert.alert("Wait", `Please wait ${timer} seconds before resending OTP.`);
      return;
    }

    setResendLoading(true);

    try {
      const res = await apiFetch("/api/auth/resend-otp/", {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        console.log("❌ RESEND OTP RESPONSE NOT JSON:", data.raw);
        Alert.alert("Server Error", "Backend returned invalid response");
        setResendLoading(false);
        return;
      }

      if (!res.ok) {
        Alert.alert("Resend Failed", data.detail || data.error || "Try again");
        setResendLoading(false);
        return;
      }

      Alert.alert("OTP Sent ✅", "A new OTP has been sent to your email.");

      // restart timer
      setTimer(60);
    } catch (err) {
      console.log("❌ Resend OTP error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }

    setResendLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>

      <Text style={styles.subText}>
        Enter the 6-digit OTP sent to your email.
      </Text>

      {/* EMAIL */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.emailInput}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* OTP BOXES */}
      <View style={styles.otpRow}>
        <TextInput
          style={styles.otpBox}
          value={otp1}
          onChangeText={(text) => {
            setOtp1(text);
            if (text) ref2.current.focus();
          }}
          keyboardType="numeric"
          maxLength={1}
        />

        <TextInput
          ref={ref2}
          style={styles.otpBox}
          value={otp2}
          onChangeText={(text) => {
            setOtp2(text);
            if (text) ref3.current.focus();
          }}
          keyboardType="numeric"
          maxLength={1}
        />

        <TextInput
          ref={ref3}
          style={styles.otpBox}
          value={otp3}
          onChangeText={(text) => {
            setOtp3(text);
            if (text) ref4.current.focus();
          }}
          keyboardType="numeric"
          maxLength={1}
        />

        <TextInput
          ref={ref4}
          style={styles.otpBox}
          value={otp4}
          onChangeText={(text) => {
            setOtp4(text);
            if (text) ref5.current.focus();
          }}
          keyboardType="numeric"
          maxLength={1}
        />

        <TextInput
          ref={ref5}
          style={styles.otpBox}
          value={otp5}
          onChangeText={(text) => {
            setOtp5(text);
            if (text) ref6.current.focus();
          }}
          keyboardType="numeric"
          maxLength={1}
        />

        <TextInput
          ref={ref6}
          style={styles.otpBox}
          value={otp6}
          onChangeText={(text) => setOtp6(text)}
          keyboardType="numeric"
          maxLength={1}
        />
      </View>

      {/* VERIFY BUTTON */}
      <Pressable
        style={styles.verifyBtn}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.verifyText}>Verify OTP</Text>
        )}
      </Pressable>

      {/* TIMER */}
      {timer > 0 ? (
        <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
      ) : (
        <Text style={styles.timerText}>You can resend OTP now</Text>
      )}

      {/* RESEND OTP */}
      <Pressable
        onPress={handleResendOTP}
        disabled={resendLoading || timer > 0}
      >
        <Text
          style={[
            styles.resendText,
            (timer > 0 || resendLoading) && { color: "#555" },
          ]}
        >
          {resendLoading ? "Sending OTP..." : "Resend OTP"}
        </Text>
      </Pressable>

      {/* BACK TO LOGIN */}
      <Text style={styles.bottomText}>
        Back to{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    color: "#7CFF00",
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subText: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 25,
    fontSize: 14,
    lineHeight: 20,
  },

  emailInput: {
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 22,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  otpBox: {
    width: 48,
    height: 55,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(124,255,0,0.3)",
    textAlign: "center",
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  verifyBtn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },

  verifyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  timerText: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
  },

  resendText: {
    color: "#7CFF00",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 15,
  },

  bottomText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },

  link: {
    color: "#7CFF00",
    fontWeight: "bold",
  },
});
