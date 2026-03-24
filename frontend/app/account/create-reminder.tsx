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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling helper
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

const FREQUENCY_OPTIONS = [
  "Does not repeat",
  "Weekly on Tuesday",
  "Every other Tuesday",
  "Monthly on the first Tuesday",
];

const CreateReminderScreen = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("Does not repeat");

  const onTimeChange = (event: any, selected: Date | undefined) => {
    if (selected) {
      setSelectedTime(selected);
    }
    if (Platform.OS === "android") {
      setShowTimePicker(false);
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
    const date = new Date(dateStr);
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
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Create a reminder</Text>
            <Text style={styles.headerSubtitle}>
              Reminders help you stay on schedule
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
              style={styles.createButton}
              onPress={() => router.back()}
            >
              <Text style={styles.createButtonText}>Create reminder</Text>
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
    height: SCREEN_HEIGHT * 0.12,
  },
  backButton: {
    padding: scale(8),
    position: "absolute",
    left: scale(10),
    top: Platform.OS === "ios" ? scale(10) : scale(20),
    zIndex: 1,
  },
  titleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: scale(26), fontWeight: "700", color: "#333" },
  headerSubtitle: { fontSize: scale(14), color: "#666", marginTop: scale(2) },
  mainContent: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: "space-around",
    paddingBottom: scale(20),
  },
  section: { flexShrink: 1, marginBottom: scale(20) },
  sectionTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#000",
    marginBottom: scale(10),
  },
  calendarWrapper: {
    backgroundColor: "transparent",
    borderRadius: scale(15),
    overflow: "hidden",
    padding: 0,
    minHeight: scale(300),
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: scale(15),
    borderRadius: 0,
  },
  selectedDateReadable: {
    fontSize: scale(16),
    color: "#333",
    fontWeight: "600",
  },
  timeBadge: {
    backgroundColor: "#3154A8",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(12),
  },
  timeBadgeText: { color: "#FFF", fontSize: scale(18), fontWeight: "700" },
  frequencyDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3154A8",
    borderRadius: scale(20),
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    backgroundColor: "white",
  },
  frequencyText: { fontSize: scale(17), color: "#333", fontWeight: "500" },
  footer: { paddingHorizontal: scale(24), paddingBottom: scale(30) },
  createButton: {
    backgroundColor: "#3154A8",
    paddingVertical: scale(18),
    borderRadius: scale(20),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  createButtonText: { color: "#FFF", fontSize: scale(20), fontWeight: "700" },
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

export default CreateReminderScreen;
