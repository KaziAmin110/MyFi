import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { appointmentsApi } from "../../utils/api";

const RemindersScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [pastReminders, setPastReminders] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, []),
  );

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        appointmentsApi.getAppointments("upcoming"),
        appointmentsApi.getAppointments("past"),
      ]);

      if (upcomingRes.success) {
        setUpcomingReminders(
          upcomingRes.data.map((app: any) => ({
            id: app.id,
            time: new Date(app.start_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            title: app.title,
            description: "Your appointment is ready to begin. Join when ready.",
            month: new Date(app.next_occurrence)
              .toLocaleString("default", { month: "short" })
              .toUpperCase(),
            day: new Date(app.next_occurrence).getDate().toString(),
            date: app.next_occurrence.split("T")[0],
            type: "Upcoming",
            active: true,
            frequency: app.is_recurring ? `Weekly` : "Does not repeat",
            fullData: app,
          })),
        );
      }

      if (pastRes.success) {
        setPastReminders(
          pastRes.data.map((app: any) => ({
            id: app.id,
            time: new Date(app.start_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            title: app.title,
            month: new Date(app.start_date)
              .toLocaleString("default", { month: "short" })
              .toUpperCase(),
            day: new Date(app.start_date).getDate().toString(),
            date: app.start_date.split("T")[0],
            type: "Past",
            active: false,
            frequency: app.is_recurring ? `Weekly` : "Does not repeat",
            fullData: app,
          })),
        );
      }
    } catch (error: any) {
      console.error("Fetch Reminders Error:", error);
      Alert.alert("Error", "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder: any) => {
    router.push({
      pathname: "/account/edit-reminder",
      params: {
        id: reminder.id,
        date: reminder.date,
        time: reminder.time,
        frequency: reminder.frequency,
      },
    });
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Reminder", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await appointmentsApi.deleteAppointment(id);
            fetchReminders();
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : "Failed to delete reminder",
            );
          }
        },
      },
    ]);
  };

  const filteredReminders = [...upcomingReminders, ...pastReminders].filter(
    (r) => {
      if (activeTab === "All") return true;
      return r.type === activeTab;
    },
  );

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
            <Text style={styles.headerTitle}>Reminders</Text>
            <Text style={styles.headerSubtitle}>
              View, edit or create a reminder
            </Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {["All", "Upcoming", "Past"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#3B66C5" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredReminders.map((reminder) => (
              <View
                key={`${reminder.type}-${reminder.id}`}
                style={[
                  styles.reminderCard,
                  !reminder.active && styles.inactiveCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeText}>{reminder.time}</Text>
                    <Text
                      style={[
                        styles.reminderTitle,
                        reminder.active
                          ? styles.activeTitle
                          : styles.inactiveTitle,
                      ]}
                    >
                      {reminder.title}
                    </Text>
                    {reminder.description && (
                      <Text style={styles.descriptionText}>
                        {reminder.description}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.calendarBadge,
                      !reminder.active && styles.inactiveBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.monthStrip,
                        !reminder.active && styles.inactiveMonthStrip,
                      ]}
                    >
                      <Text style={styles.monthText}>{reminder.month}</Text>
                    </View>
                    <Text style={styles.dayText}>{reminder.day}</Text>
                  </View>
                </View>

                {reminder.active && (
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleDelete(reminder.id)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(reminder)}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/account/create-reminder")}
        >
          <Ionicons name="add" size={40} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    position: "absolute",
    left: 10,
    top: Platform.OS === "ios" ? 10 : 40,
    zIndex: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTab: {
    backgroundColor: "#3B66C5",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  activeTabText: {
    color: "white",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  reminderCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inactiveCard: {
    backgroundColor: "#E8E8E8",
    shadowOpacity: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  activeTitle: {
    color: "#3B66C5",
  },
  inactiveTitle: {
    color: "#999",
  },
  descriptionText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
  calendarBadge: {
    width: 60,
    height: 70,
    borderWidth: 1,
    borderColor: "#3B66C5",
    borderRadius: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  inactiveBadge: {
    borderColor: "#999",
  },
  monthStrip: {
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 4,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#3B66C5",
  },
  inactiveMonthStrip: {
    borderBottomColor: "#999",
  },
  monthText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B66C5",
  },
  dayText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  cancelText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    backgroundColor: "#3B66C5",
  },
  editText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#3B66C5",
    width: 250,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default RemindersScreen;
