import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { appointmentsApi, userApi } from "../../utils/api";

import { SkeletonReminderCard } from "../../components/reminders/SkeletonReminderCard";
import { ReminderCard } from "../../components/reminders/ReminderCard";
import { EmptyReminderState } from "../../components/reminders/EmptyReminderState";

const RemindersScreen = () => {
  const router = useRouter();
  const { highlightDate } = useLocalSearchParams<{ highlightDate?: string }>();
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, []),
  );

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const upcomingRes = await appointmentsApi.getAppointments("upcoming");

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

  const requestNotificationsPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Please enable notifications in your settings to receive appointment reminders.",
      );
      return false;
    }

    // Get the token and save it to the backend
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn(
          "Push notifications are not configured: Missing EAS project ID in app.json",
        );
        return true;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      await userApi.updateExpoPushToken(tokenData.data);
    } catch (error) {
      console.error("Error getting/saving push token:", error);
    }

    return true;
  };

  const handleAddPress = async () => {
    const hasPermission = await requestNotificationsPermission();
    if (hasPermission) {
      router.push("/account/create-reminder");
    }
  };

  const filteredReminders = upcomingReminders.filter((r) => {
    if (activeTab === "All") return true;
    return r.type === activeTab;
  });

  return (
    <LinearGradient colors={["#D5E6FF", "#F5F5F5"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/account/dashboard")}
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
          {["All", "Upcoming"].map((tab) => (
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SkeletonReminderCard />
            <SkeletonReminderCard />
            <SkeletonReminderCard />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredReminders.length === 0 ? (
              <EmptyReminderState activeTab={activeTab} />
            ) : (
              filteredReminders.map((reminder) => (
                <ReminderCard
                  key={`${reminder.type}-${reminder.id}`}
                  reminder={reminder}
                  highlightDate={highlightDate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
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
    flexGrow: 1,
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
