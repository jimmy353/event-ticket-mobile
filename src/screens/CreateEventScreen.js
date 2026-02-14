import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { apiFetch } from "../services/api";

export default function CreateEventScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [category, setCategory] = useState("music");

  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());

  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [image, setImage] = useState(null);

  const categories = ["music", "sports", "nightlife"];

  // ✅ Pick Image
  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  // ✅ Format date
  function formatDateOnly(dateObj) {
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ✅ Format time
  function formatTimeOnly(dateObj) {
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ✅ Combine Date + Time into one DateTime
  function combineDateAndTime(datePart, timePart) {
    const combined = new Date(datePart);

    combined.setHours(timePart.getHours());
    combined.setMinutes(timePart.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);

    return combined;
  }

  // ✅ Submit Event
  async function createEvent() {
    if (!title || !description || !location) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    if (!image) {
      Alert.alert("Image Required", "Please upload an event image.");
      return;
    }

    const startDateTime = combineDateAndTime(startDate, startTime);
    const endDateTime = combineDateAndTime(endDate, endTime);

    if (endDateTime <= startDateTime) {
      Alert.alert("Invalid Date", "End date/time must be after start date/time.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category", category);

      formData.append("start_date", startDateTime.toISOString());
      formData.append("end_date", endDateTime.toISOString());

      formData.append("payout_done", "false");

      formData.append("image", {
        uri: image.uri,
        name: "event.jpg",
        type: "image/jpeg",
      });

      const res = await apiFetch("/api/events/create/", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("❌ Create event returned HTML:", text);
        Alert.alert("Error", "Server returned invalid response.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        console.log("❌ Create event error:", data);
        Alert.alert("Error", data.detail || "Failed to create event.");
        setLoading(false);
        return;
      }

      Alert.alert("Success", "Event created successfully!");
      navigation.goBack();
    } catch (err) {
      console.log("❌ Create event exception:", err.message);
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Create Event</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Music Concert Juba"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
      />

      {/* DESCRIPTION */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Write event details..."
        placeholderTextColor="#666"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      {/* LOCATION */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Juba, South Sudan"
        placeholderTextColor="#666"
        value={location}
        onChangeText={setLocation}
      />

      {/* START DATE */}
      <Text style={styles.label}>Start Date</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.dateBox}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.dateValue}>{formatDateOnly(startDate)}</Text>
          <Ionicons name="calendar" size={20} color="#00BFFF" />
        </Pressable>

        <Pressable
          style={styles.dateBox}
          onPress={() => setShowStartTimePicker(true)}
        >
          <Text style={styles.dateValue}>{formatTimeOnly(startTime)}</Text>
          <Ionicons name="time" size={20} color="#00BFFF" />
        </Pressable>
      </View>

      <Text style={styles.note}>Note: You are 4 hours ahead of server time.</Text>

      {/* END DATE */}
      <Text style={styles.label}>End Date</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.dateBox}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.dateValue}>{formatDateOnly(endDate)}</Text>
          <Ionicons name="calendar" size={20} color="#00BFFF" />
        </Pressable>

        <Pressable
          style={styles.dateBox}
          onPress={() => setShowEndTimePicker(true)}
        >
          <Text style={styles.dateValue}>{formatTimeOnly(endTime)}</Text>
          <Ionicons name="time" size={20} color="#00BFFF" />
        </Pressable>
      </View>

      <Text style={styles.note}>Note: You are 4 hours ahead of server time.</Text>

      {/* IMAGE */}
      <Text style={styles.label}>Event Image</Text>

      <Pressable style={styles.uploadBtn} onPress={pickImage}>
        <Ionicons name="image" size={22} color="#000" />
        <Text style={styles.uploadText}>Choose File</Text>
      </Pressable>

      {image && (
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      )}

      {/* CATEGORY */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {categories.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.categoryBtn,
              category === item && styles.categoryActive,
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.categoryTextActive,
              ]}
            >
              {item.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* SUBMIT */}
      <Pressable style={styles.createBtn} onPress={createEvent} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.createText}>Create Event</Text>
        )}
      </Pressable>

      <View style={{ height: 100 }} />

      {/* ================= MODAL PICKERS ================= */}

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        date={startDate}
        onConfirm={(date) => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="time"
        date={startTime}
        onConfirm={(time) => {
          setStartTime(time);
          setShowStartTimePicker(false);
        }}
        onCancel={() => setShowStartTimePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        date={endDate}
        onConfirm={(date) => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="time"
        date={endTime}
        onConfirm={(time) => {
          setEndTime(time);
          setShowEndTimePicker(false);
        }}
        onCancel={() => setShowEndTimePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 12,
  },

  label: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 18,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },

  textarea: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    height: 120,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  dateBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  note: {
    color: "#666",
    fontSize: 12,
    marginTop: 10,
  },

  uploadBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7CFF00",
    paddingVertical: 18,
    borderRadius: 28,
    marginTop: 8,
  },

  uploadText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },

  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },

  categoryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },

  categoryActive: {
    backgroundColor: "#7CFF00",
    borderColor: "#7CFF00",
  },

  categoryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  categoryTextActive: {
    color: "#000",
  },

  createBtn: {
    backgroundColor: "#7CFF00",
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 40,
  },

  createText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 20,
  },
});