import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyReminderStateProps {
  activeTab: string;
}

export const EmptyReminderState: React.FC<EmptyReminderStateProps> = ({
  activeTab,
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyStateIconContainer}>
          <Ionicons name="calendar-outline" size={40} color="#3B66C5" />
        </View>
        <Text style={styles.emptyStateTitle}>No Reminders</Text>
        <Text style={styles.emptyStateSubtitle}>
          {activeTab === "All"
            ? "You haven't created any reminders yet. Tap the + button below to get started."
            : "You don't have any upcoming reminders. Tap the + button below to add one."}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  emptyStateCard: {
    backgroundColor: "white",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(59, 102, 197, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
