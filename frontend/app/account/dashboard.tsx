import {
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";
import HabitCard from "../../components/HabitCard";
import { appointmentsApi } from "../../utils/api";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";
import * as Haptics from "expo-haptics";

import { DashboardHero } from "../../components/dashboard/DashboardHero";
import { DashboardCalendar } from "../../components/dashboard/DashboardCalendar";
import { MoneyMood } from "../../components/dashboard/MoneyMood";
import { AppointmentReminder } from "../../components/dashboard/AppointmentReminder";
import { HabitDetailModal } from "../../components/dashboard/HabitDetailModal";

const Dashboard = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 500;
  const maxWidth = 600;
  const contentWidth = width > maxWidth ? maxWidth : ("100%" as const);

  const [firstName, setFirstName] = useState("");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [appointmentDates, setAppointmentDates] = useState<string[]>([]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = weekInfo(anchorDate);

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitOpen, setHabitOpen] = useState(false);
  const pendingHabitude = useRef<string | null>(null);

  const openHabit = (habit: any) => {
    setSelectedHabit(habit);
    setHabitOpen(true);
  };
  const closeHabit = () => {
    setHabitOpen(false);
    setSelectedHabit(null);
  };

  useEffect(() => {
    const getUser = async () => {
      const stored = await SecureStore.getItemAsync("user");
      if (stored) {
        const user = JSON.parse(stored);
        setFirstName(user.name.split(" ")[0] || "User");
      }
    };
    getUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchReminders = async () => {
        try {
          const start = weekDates[0].toISOString().split("T")[0];
          const end = weekDates[6].toISOString().split("T")[0];
          const res = await appointmentsApi.getCalendar(start, end);
          if (res.success) {
            setAppointmentDates(res.data.dates);
          }
        } catch (error) {
          console.error("Dashboard Fetch Calendar Error:", error);
        }
      };
      fetchReminders();
    }, [weekDates]),
  );

  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);

    const todayRef = new Date();
    const todayStart = getStart(todayRef);
    const prevStart = getStart(prev);

    if (prevStart.getTime() < todayStart.getTime()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnchorDate(next);
  };

  const currentMonthYear = anchorDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const isAtStart = getStart(anchorDate).getTime() <= today.getTime();

  return (
    <LinearGradient
      colors={["#D5E6FF", "#F5F5F5"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.4 }}
      style={styles.background}
    >
      <View
        style={[
          styles.scroll,
          styles.scrollContent,
          {
            paddingTop: insets.top + (isTablet ? 20 : 12),
          },
        ]}
      >
        <DashboardHero firstName={firstName} contentWidth={contentWidth} />

        <DashboardCalendar
          contentWidth={contentWidth}
          handlePrevWeek={handlePrevWeek}
          handleNextWeek={handleNextWeek}
          isAtStart={isAtStart}
          currentMonthYear={currentMonthYear}
          weekDates={weekDates}
          appointmentDates={appointmentDates}
          onNavigateToReminders={(dateStr) => {
            router.push({
              pathname: "/account/reminders",
              params: { highlightDate: dateStr },
            });
          }}
        />

        <MoneyMood contentWidth={contentWidth} />

        <AppointmentReminder
          contentWidth={contentWidth}
          onPress={() => router.push("/account/reminders")}
        />

        <View
          style={[
            styles.cardsSection,
            { paddingBottom: insets.bottom + 20, flex: 1 },
          ]}
        >
          <Text style={styles.cardTitle}>Learn about the Habitudes</Text>
          <Text style={styles.cardSubTitle}>
            Press any card for more information
          </Text>

          <HabitCard onSelect={openHabit} />
        </View>
      </View>

      <HabitDetailModal
        visible={habitOpen}
        selectedHabit={selectedHabit}
        onClose={closeHabit}
        onAskAiCoach={(title) => {
          pendingHabitude.current = title;
          closeHabit();
        }}
        onDismiss={() => {
          if (pendingHabitude.current) {
            const name = pendingHabitude.current;
            pendingHabitude.current = null;
            router.push({
              pathname: "/account/chat",
              params: { habitude: name },
            });
          }
        }}
        height={height}
        insetsBottom={insets.bottom}
      />
    </LinearGradient>
  );
};

export default Dashboard;

const getStart = (date: Date) => {
  const obj = new Date(date);
  obj.setHours(0, 0, 0, 0);
  const dayOfWeek = obj.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  obj.setDate(obj.getDate() - diff);
  return obj;
};

const weekInfo = (anchor: Date) => {
  const start = getStart(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardsSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: moderateVerticalScale(25),
    paddingBottom: moderateVerticalScale(12),
    marginTop: moderateVerticalScale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    alignItems: "center",
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#3D3D3D",
    marginBottom: moderateVerticalScale(4),
  },
  cardSubTitle: {
    fontSize: moderateScale(14),
    color: "#6A6A6A",
    marginBottom: moderateVerticalScale(8),
  },
});
