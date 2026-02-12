import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./api";
import { refreshToken, logout } from "./auth";

export async function apiRequest(endpoint, options = {}) {
  let access = await AsyncStorage.getItem("access");

  let headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (access) {
    headers["Authorization"] = `Bearer ${access}`;
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 🔥 If token expired, refresh and retry once
  if (res.status === 401) {
    const newAccess = await refreshToken();

    if (!newAccess) {
      await logout();
      throw new Error("SESSION_EXPIRED");
    }

    headers["Authorization"] = `Bearer ${newAccess}`;

    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server returned invalid JSON (maybe HTML page).");
  }

  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}
