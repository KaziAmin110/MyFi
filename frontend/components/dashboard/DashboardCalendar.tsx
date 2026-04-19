import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";

interface DashboardCalendarProps {
  contentWidth: number | `${number}%`;
  handlePrevWeek: () => void;
  handleNextWeek: () => void;
  isAtStart: boolean;
  currentMonthYear: string;
  weekDates: Date[];
  appointmentDates: string[];
  onNavigateToReminders: (dateStr: string) => void;
}

const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  contentWidth,
  handlePrevWeek,
  handleNextWeek,
  isAtStart,
  currentMonthYear,
  weekDates,
  appointmentDates,
  onNavigateToReminders,
}) => {
  return (
    <View
      style={[
        styles.calendar,
        { width: contentWidth as any, alignSelf: "center" },
      ]}
    >
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={handlePrevWeek}
          disabled={isAtStart}
          style={({ pressed }) => [
            styles.navBtn,
            pressed && !isAtStart && { opacity: 0.5 },
            isAtStart && { opacity: 0.3 },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isAtStart ? "#D1D1D1" : "#3D3D3D"}
          />
        </Pressable>
        <Text style={styles.monthName}>{currentMonthYear}</Text>
        <Pressable
          onPress={handleNextWeek}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-forward" size={20} color="#3D3D3D" />
        </Pressable>
      </View>

      <View style={styles.week}>
        {weekDates.map((day) => {
          const todayDay = isToday(day);
          const dateStr = day.toISOString().split("T")[0];
          const hasReminder = appointmentDates.includes(dateStr);
          return (
            <Pressable
              key={day.toISOString()}
              style={styles.day}
              onPress={() => {
                if (hasReminder) {
                  onNavigateToReminders(dateStr);
                }
              }}
            >
              <Text
                style={[
                  styles.dayLabel,
                  todayDay ? styles.todayLabel : styles.normalLabel,
                ]}
              >
                {dayLabel[day.getDay()]}
              </Text>
              <View style={[styles.dateBubble, todayDay && styles.todayBubble]}>
                <Text
                  style={[
                    styles.date,
                    todayDay ? styles.todayDate : styles.normalDate,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              {hasReminder && <View style={styles.blueDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendar: {
    paddingVertical: moderateVerticalScale(2),
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateVerticalScale(8),
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateVerticalScale(2),
  },
  monthName: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#3D3D3D",
    paddingBottom: moderateVerticalScale(2),
  },
  navBtn: {
    padding: 4,
  },
  week: {
    flexDirection: "row",
    width: "100%",
  },
  day: {
    flex: 1,
    alignItems: "center",
  },
  dayLabel: {
    marginBottom: 2,
    fontSize: moderateScale(13),
    paddingTop: moderateVerticalScale(2),
  },
  todayLabel: {
    color: "#000000",
    fontWeight: "700",
  },
  normalLabel: {
    color: "#5D5D5D",
  },
  todayBubble: {
    backgroundColor: "#06BE00",
  },
  todayDate: {
    color: "#FFFFFF",
  },
  normalDate: {
    color: "#000000",
  },
  dateBubble: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateVerticalScale(5),
  },
  date: {
    fontWeight: "600",
    fontSize: moderateScale(12),
  },
  blueDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3059AD",
  },
});
