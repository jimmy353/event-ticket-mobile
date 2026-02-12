import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

// ✅ SAFE JSON PARSER
async function safeJson(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.log("❌ Backend returned HTML instead of JSON:", text);
    return { error: "Invalid server response", raw: text };
  }
}

// ✅ LOGIN
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data.detail || data.error || "Login failed");
  }

  await AsyncStorage.setItem("access", data.access);
  await AsyncStorage.setItem("refresh", data.refresh);

  return data;
}

// ✅ REFRESH ACCESS TOKEN
export async function refreshToken() {
  try {
    const refresh = await AsyncStorage.getItem("refresh");

    if (!refresh) return null;

    const res = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    const data = await safeJson(res);

    if (data.access) {
      await AsyncStorage.setItem("access", data.access);
      return data.access;
    }

    return null;
  } catch (err) {
    console.log("Refresh token error:", err);
    return null;
  }
}

// ✅ LOGOUT
export async function logout() {
  await AsyncStorage.removeItem("access");
  await AsyncStorage.removeItem("refresh");
}