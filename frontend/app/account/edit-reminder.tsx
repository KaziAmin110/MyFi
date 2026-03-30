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
  ScrollView,
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
  const todayISO = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(() => {
    try {
      // Robust regex to handle diverse locale formats (like narrow non-breaking spaces)
      const timeParts = initialTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!timeParts) return new Date();
      const [, hoursStr, minutesStr, modifier] = timeParts;
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    } catch (e) {
      console.error("Time Parse Error:", e);
      return new Date();
    }
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(
    params.frequency ? String(params.frequency) : "Does not repeat",
  );
  const [loading, setLoading] = useState(false);

  const onTimeChange = (_event: any, selected: Date | undefined) => {
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainContent}
        >
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.calendarWrapper}>
              <Calendar
                current={selectedDate}
                minDate={todayISO}
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    disableTouchEvent: true,
                    selectedColor: "#3154A8",
                    selectedTextColor: "white",
                  },
                }}
                theme={{
                  backgroundColor: "transparent",
                  calendarBackground: "#FFFFFF",
                  textSectionTitleColor: "#999",
                  selectedDayBackgroundColor: "#3154A8",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#3154A8",
                  dayTextColor: "#333",
                  textDisabledColor: "#d9e1e8",
                  dotColor: "#3154A8",
                  selectedDotColor: "#ffffff",
                  arrowColor: "#333",
                  monthTextColor: "#333",
                  indicatorColor: "blue",
                  textDayFontWeight: "600",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: scale(14),
                  textMonthFontSize: scale(18),
                  textDayHeaderFontSize: scale(11),
                }}
              />
            </View>
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <TouchableOpacity
              style={styles.timeView}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.timeInfo}>
                <Ionicons
                  name="calendar-outline"
                  size={scale(20)}
                  color="#666"
                />
                <Text style={styles.selectedDateReadable}>
                  {formatDateReadable(selectedDate)}
                </Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>
                  {formatTime(selectedTime)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Reminder Frequency</Text>
            <TouchableOpacity
              style={styles.frequencyDropdown}
              onPress={() => setShowFrequencyPicker(true)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="repeat" size={scale(20)} color="#666" />
                <Text style={styles.frequencyText}>{selectedFrequency}</Text>
              </View>
              <Ionicons name="chevron-down" size={scale(22)} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerFiller} />
        </ScrollView>

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
    paddingTop: Platform.OS === "ios" ? scale(10) : scale(30),
    flexDirection: "row",
    alignItems: "center",
    height: SCREEN_HEIGHT * 0.12,
  },
  backButton: {
    padding: scale(8),
    position: "absolute",
    left: scale(10),
    top: Platform.OS === "ios" ? scale(10) : scale(30),
    zIndex: 1,
  },
  titleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: scale(26), fontWeight: "700", color: "#333" },
  headerSubtitle: { fontSize: scale(14), color: "#666", marginTop: scale(2) },
  mainContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(120),
    paddingTop: scale(10),
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(24),
    padding: scale(20),
    marginBottom: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#333",
    marginBottom: scale(12),
    marginLeft: scale(4),
  },
  calendarWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(15),
    overflow: "hidden",
  },
  timeView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(4),
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  selectedDateReadable: {
    fontSize: scale(14),
    color: "#444",
    fontWeight: "600",
  },
  timeBadge: {
    backgroundColor: "#3154A8",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(14),
  },
  timeBadgeText: { color: "#FFF", fontSize: scale(16), fontWeight: "700" },
  frequencyDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
  },
  frequencyText: {
    fontSize: scale(15),
    color: "#333",
    fontWeight: "600",
    marginLeft: scale(8),
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(24),
    paddingBottom: scale(30),
    paddingTop: scale(20),
    backgroundColor: "rgba(245,245,245,0.9)",
  },
  footerFiller: { height: scale(40) },
  createButton: {
    backgroundColor: "#3154A8",
    paddingVertical: scale(18),
    borderRadius: scale(20),
    alignItems: "center",
    shadowColor: "#3154A8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  doneText: { fontSize: 16, color: "#3154A8", fontWeight: "700" },
  frequencyList: { paddingVertical: 10 },
  frequencyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedFrequencyOption: { backgroundColor: "#F5F8FF" },
  frequencyOptionText: { fontSize: 16, color: "#333", fontWeight: "500" },
  selectedFrequencyOptionText: { color: "#3B66C5", fontWeight: "700" },
});

export default EditReminderScreen;
