import { API_URL } from "./api";

export async function getEvents() {
  const res = await fetch(`${API_URL}/api/events/`);

  if (!res.ok) {
    throw new Error("Failed to load events");
  }

  return await res.json();
}
