import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

// Safe JSON Reader
export async function safeJson(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.log("❌ Server returned HTML instead of JSON:", text);
    return { error: "Invalid server response", raw: text };
  }
}

// Refresh Access Token Automatically
async function refreshAccessToken() {
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
  } catch (error) {
    console.log("Refresh token error:", error);
    return null;
  }
}

// Fetch Wrapper
export async function apiFetch(url, options = {}) {
  let access = await AsyncStorage.getItem("access");

  const headers = {
    ...(options.headers || {}),
  };

  // Only add JSON header if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }

  let res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // If token expired, refresh
  if (res.status === 401) {
    const newAccess = await refreshAccessToken();

    if (newAccess) {
      headers.Authorization = `Bearer ${newAccess}`;

      res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
      });
    }
  }

  return res;
}