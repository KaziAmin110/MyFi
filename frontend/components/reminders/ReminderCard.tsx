import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ReminderCardProps {
  reminder: any;
  highlightDate?: string;
  onEdit: (reminder: any) => void;
  onDelete: (id: string) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  highlightDate,
  onEdit,
  onDelete,
}) => {
  return (
    <View
      style={[
        styles.reminderCard,
        !reminder.active && styles.inactiveCard,
        highlightDate === reminder.date && styles.highlightedCard,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>{reminder.time}</Text>
          <Text
            style={[
              styles.reminderTitle,
              reminder.active ? styles.activeTitle : styles.inactiveTitle,
            ]}
          >
            {reminder.title}
          </Text>
          {reminder.description && (
            <Text style={styles.descriptionText}>{reminder.description}</Text>
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
            onPress={() => onDelete(reminder.id)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(reminder)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  highlightedCard: {
    borderColor: "#3B66C5",
    borderWidth: 2,
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
});
