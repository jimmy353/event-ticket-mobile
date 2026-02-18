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

export default function ResetPasswordScreen({ route, navigation }) {
  const emailFromRoute = route?.params?.email || "";

  const [email, setEmail] = useState(emailFromRoute);

  // OTP digits
  const [o1, setO1] = useState("");
  const [o2, setO2] = useState("");
  const [o3, setO3] = useState("");
  const [o4, setO4] = useState("");
  const [o5, setO5] = useState("");
  const [o6, setO6] = useState("");

  const otp = `${o1}${o2}${o3}${o4}${o5}${o6}`;

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // timer
  const [timer, setTimer] = useState(60);

  // refs
  const r2 = useRef();
  const r3 = useRef();
  const r4 = useRef();
  const r5 = useRef();
  const r6 = useRef();

  // ==========================
  // TIMER COUNTDOWN
  // ==========================
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ==========================
  // RESET PASSWORD
  // ==========================
  const handleResetPassword = async () => {
    if (!email || otp.length !== 6 || !newPassword || !newPassword2) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword !== newPassword2) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/reset-password/", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
          new_password2: newPassword2,
        }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        Alert.alert("Server Error", "Backend returned invalid response");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const msg =
          data?.detail ||
          data?.error ||
          Object.entries(data || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");

        Alert.alert("Reset Failed", msg || "Try again");
        setLoading(false);
        return;
      }

      Alert.alert(
        "Success ✅",
        "Password reset successful. You can now login."
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
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
      Alert.alert("Wait", `Please wait ${timer} seconds`);
      return;
    }

    setResendLoading(true);

    try {
      const res = await apiFetch("/api/auth/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        Alert.alert("Server Error", "Backend returned invalid response");
        setResendLoading(false);
        return;
      }

      if (!res.ok) {
        Alert.alert("Failed", data?.detail || data?.error || "Try again");
        setResendLoading(false);
        return;
      }

      Alert.alert("OTP Sent ✅", "New OTP sent to your email");
      setTimer(60);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    }

    setResendLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subText}>
        Enter the OTP sent to your email and set a new password.
      </Text>

      {/* EMAIL */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* OTP BOXES */}
      <View style={styles.otpRow}>
        <TextInput style={styles.otpBox} value={o1} onChangeText={(t) => { setO1(t); if (t) r2.current.focus(); }} maxLength={1} keyboardType="numeric" />
        <TextInput ref={r2} style={styles.otpBox} value={o2} onChangeText={(t) => { setO2(t); if (t) r3.current.focus(); }} maxLength={1} keyboardType="numeric" />
        <TextInput ref={r3} style={styles.otpBox} value={o3} onChangeText={(t) => { setO3(t); if (t) r4.current.focus(); }} maxLength={1} keyboardType="numeric" />
        <TextInput ref={r4} style={styles.otpBox} value={o4} onChangeText={(t) => { setO4(t); if (t) r5.current.focus(); }} maxLength={1} keyboardType="numeric" />
        <TextInput ref={r5} style={styles.otpBox} value={o5} onChangeText={(t) => { setO5(t); if (t) r6.current.focus(); }} maxLength={1} keyboardType="numeric" />
        <TextInput ref={r6} style={styles.otpBox} value={o6} onChangeText={setO6} maxLength={1} keyboardType="numeric" />
      </View>

      {/* PASSWORDS */}
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={newPassword2}
        onChangeText={setNewPassword2}
      />

      {/* BUTTON */}
      <Pressable style={styles.btn} onPress={handleResetPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Reset Password</Text>}
      </Pressable>

      {/* TIMER */}
      <Text style={styles.timerText}>
        {timer > 0 ? `Resend OTP in ${timer}s` : "You can resend OTP now"}
      </Text>

      {/* RESEND */}
      <Pressable onPress={handleResendOTP} disabled={timer > 0 || resendLoading}>
        <Text style={[styles.resendText, (timer > 0 || resendLoading) && { color: "#555" }]}>
          {resendLoading ? "Sending OTP..." : "Resend OTP"}
        </Text>
      </Pressable>

      <Text style={styles.bottomText}>
        Back to{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 24, justifyContent: "center" },
  title: { color: "#7CFF00", fontSize: 32, fontWeight: "bold", textAlign: "center" },
  subText: { color: "#aaa", textAlign: "center", marginBottom: 20 },
  input: {
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    color: "#fff",
  },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  otpBox: {
    width: 48,
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    textAlign: "center",
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  btn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { fontSize: 18, fontWeight: "bold", color: "#000" },
  timerText: { color: "#aaa", textAlign: "center", marginTop: 12 },
  resendText: { color: "#7CFF00", textAlign: "center", fontWeight: "bold", marginTop: 8 },
  bottomText: { color: "#aaa", textAlign: "center", marginTop: 20 },
  link: { color: "#7CFF00", fontWeight: "bold" },
});
