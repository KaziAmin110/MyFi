import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { appointmentsApi } from "../../utils/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling helper
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

const FREQUENCY_OPTIONS = [
  "Does not repeat",
  "Weekly on Monday",
  "Weekly on Tuesday",
  "Weekly on Wednesday",
  "Weekly on Thursday",
  "Weekly on Friday",
  "Weekly on Saturday",
  "Weekly on Sunday",
];

const EditReminderScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse pre-filled data from params
  const initialDate = params.date
    ? String(params.date)
    : new Date().toISOString().split("T")[0];
  const initialTimeStr = params.time ? String(params.time) : "8:00 AM";

  // Helper to convert "8:00 AM" to Date object
  const parseTimeStr = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(
    parseTimeStr(initialTimeStr),
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(
    params.frequency ? String(params.frequency) : "Does not repeat",
  );
  const [loading, setLoading] = useState(false);

  const onTimeChange = (event: any, selected: Date | undefined) => {
    if (selected) {
      setSelectedTime(selected);
    }
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Create date by splitting YYYY-MM-DD to avoid timezone shifting
      const [year, month, day] = selectedDate.split("-").map(Number);
      const combinedDateTime = new Date(year, month - 1, day);
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());
      combinedDateTime.setSeconds(0);
      combinedDateTime.setMilliseconds(0);

      const isRecurring = selectedFrequency !== "Does not repeat";
      let daysOfWeek: string[] = [];
      if (isRecurring) {
        const dayName = selectedFrequency.split(" on ")[1];
        if (dayName) {
          daysOfWeek = [dayName.toLowerCase()];
        }
      }

      const payload = {
        title: `Financial Check-in`,
        start_date: combinedDateTime.toISOString(),
        is_recurring: isRecurring,
        days_of_week: daysOfWeek,
        recurrence_frequency: isRecurring ? "weekly" : null,
        reminder_enabled: true,
        max_occurences: isRecurring ? 12 : 1,
      };

      const res = await appointmentsApi.updateAppointment(
        params.id as string,
        payload,
      );
      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Reminder updated successfully!",
        });
        router.replace("/account/reminders");
      }
    } catch (error: any) {
      console.error("Update Appointment Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update reminder",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateReadable = (dateStr: string) => {
    // Append T00:00:00 to treat as local date rather than UTC
    const date = new Date(dateStr + "T00:00:00");
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  return (
    <LinearGradient colors={["#D5E6FF", "#F5F5F5"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/account/reminders")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Edit reminder</Text>
            <Text style={styles.headerSubtitle}>
              Update your reminder settings
            </Text>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.calendarWrapper}>
              <Calendar
                current={selectedDate}
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    disableTouchEvent: true,
                    selectedColor: "#3B66C5",
                    selectedTextColor: "white",
                  },
                }}
                theme={{
                  backgroundColor: "transparent",
                  calendarBackground: "transparent",
                  textSectionTitleColor: "#999",
                  selectedDayBackgroundColor: "#3B66C5",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#3B66C5",
                  dayTextColor: "#333",
                  textDisabledColor: "#d9e1e8",
                  dotColor: "#3B66C5",
                  selectedDotColor: "#ffffff",
                  arrowColor: "#333",
                  monthTextColor: "#333",
                  indicatorColor: "blue",
                  textDayFontWeight: "600",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: scale(14),
                  textMonthFontSize: scale(20),
                  textDayHeaderFontSize: scale(12),
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeRow}>
              <Text style={styles.selectedDateReadable}>
                {formatDateReadable(selectedDate)}
              </Text>
              <TouchableOpacity
                style={styles.timeBadge}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeBadgeText}>
                  {formatTime(selectedTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { marginBottom: scale(15) }]}>
            <Text style={styles.sectionTitle}>Reminder Frequency</Text>
            <TouchableOpacity
              style={styles.frequencyDropdown}
              onPress={() => setShowFrequencyPicker(true)}
            >
              <Text style={styles.frequencyText}>{selectedFrequency}</Text>
              <Ionicons name="chevron-down" size={scale(24)} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {!showTimePicker && !showFrequencyPicker && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.createButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Update reminder</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
                textColor="#000"
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showFrequencyPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFrequencyPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFrequencyPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reminder Frequency</Text>
                <TouchableOpacity onPress={() => setShowFrequencyPicker(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.frequencyList}>
                {FREQUENCY_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.frequencyOption,
                      selectedFrequency === item &&
                        styles.selectedFrequencyOption,
                    ]}
                    onPress={() => {
                      setSelectedFrequency(item);
                      setShowFrequencyPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.frequencyOptionText,
                        selectedFrequency === item &&
                          styles.selectedFrequencyOptionText,
                      ]}
                    >
                      {item}
                    </Text>
                    {selectedFrequency === item && (
                      <Ionicons name="checkmark" size={20} color="#3B66C5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === "ios" ? scale(10) : scale(20),
    flexDirection: "row",
    alignItems: "center",
    height: SCREEN_HEIGHT * 0.1,
  },
  backButton: {
    padding: scale(8),
    position: "absolute",
    left: scale(10),
    top: Platform.OS === "ios" ? scale(10) : scale(20),
    zIndex: 1,
  },
  titleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: scale(24), fontWeight: "700", color: "#333" },
  headerSubtitle: { fontSize: scale(13), color: "#666", marginTop: scale(2) },
  mainContent: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: "space-between",
    paddingBottom: scale(10),
  },
  section: { flexShrink: 1, marginBottom: scale(10) },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#000",
    marginBottom: scale(8),
  },
  calendarWrapper: {
    backgroundColor: "transparent",
    borderRadius: scale(15),
    overflow: "hidden",
    padding: 0,
    minHeight: scale(280),
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: scale(10),
    borderRadius: 0,
  },
  selectedDateReadable: {
    fontSize: scale(14),
    color: "#333",
    fontWeight: "600",
  },
  timeBadge: {
    backgroundColor: "#3154A8",
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    borderRadius: scale(12),
  },
  timeBadgeText: { color: "#FFF", fontSize: scale(16), fontWeight: "700" },
  frequencyDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3154A8",
    borderRadius: scale(15),
    paddingHorizontal: scale(15),
    paddingVertical: scale(10),
    backgroundColor: "white",
  },
  frequencyText: { fontSize: scale(15), color: "#333", fontWeight: "500" },
  footer: { paddingHorizontal: scale(24), paddingBottom: scale(20) },
  createButton: {
    backgroundColor: "#3154A8",
    paddingVertical: scale(15),
    borderRadius: scale(15),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  createButtonText: { color: "#FFF", fontSize: scale(18), fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  doneText: {
    fontSize: 16,
    color: "#3154A8",
    fontWeight: "700",
  },
  frequencyList: {
    paddingVertical: 10,
  },
  frequencyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedFrequencyOption: {
    backgroundColor: "#F5F8FF",
  },
  frequencyOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  selectedFrequencyOptionText: {
    color: "#3B66C5",
    fontWeight: "700",
  },
});

export default EditReminderScreen;
