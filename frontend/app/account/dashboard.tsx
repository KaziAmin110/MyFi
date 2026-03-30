import {
  Text,
  View,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import Slider from "@react-native-community/slider";
import * as SecureStore from "expo-secure-store";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import HabitCard from "../../components/HabitCard";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { appointmentsApi } from "../../utils/api";

const Dashboard = () => {
  const router = useRouter();
  const [mood, setMood] = useState(60);
  const [firstName, setFirstName] = useState("");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [appointmentDates, setAppointmentDates] = useState<string[]>([]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDates = weekInfo(anchorDate);

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitOpen, setHabitOpen] = useState(false);

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

  useEffect(() => {
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
  }, [anchorDate, weekDates]);

  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);

    // Restriction: Cannot go to a week earlier than the current week
    const today = new Date();
    const todayStart = getStart(today);
    const prevStart = getStart(prev);

    if (prevStart.getTime() < todayStart.getTime()) {
      return;
    }

    setAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
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
      <View style={styles.container}>
        {/* Upper content — spreads evenly to fill available space */}
        <View style={styles.upperContent}>
          <MaskedView
            maskElement={<Text style={styles.title}>Hello {firstName}!</Text>}
          >
            <LinearGradient
              colors={["#12BD37", "#3059AD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>
                Hello {firstName}!
              </Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.subtitle}>
            Let{"'"}s <Text style={styles.tackle}>tackle</Text> your financial
            habits
          </Text>

          {/* Calendar*/}
          <View style={styles.calendar}>
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
                style={({ pressed }) => [
                  styles.navBtn,
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Ionicons name="chevron-forward" size={20} color="#3D3D3D" />
              </Pressable>
            </View>
            <View style={styles.week}>
              {weekDates.map((day, i) => {
                const today = isToday(day);
                const dateStr = day.toISOString().split("T")[0];
                const hasReminder = appointmentDates.includes(dateStr);
                return (
                  <View key={day.toISOString()} style={styles.day}>
                    <Text
                      style={[
                        styles.dayLabel,
                        today ? styles.todayLabel : styles.normalLabel,
                      ]}
                    >
                      {dayLabel[day.getDay()]}
                    </Text>
                    <View
                      style={[styles.dateBubble, today && styles.todayBubble]}
                    >
                      <Text
                        style={[
                          styles.date,
                          today ? styles.todayDate : styles.normalDate,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                    {hasReminder && <View style={styles.blueDot} />}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Money Mood Slider*/}
          <View style={styles.moneyMood}>
            <Text style={styles.moneyMoodTitle}>
              What is your money mood today?
            </Text>

            <View style={styles.sliderRow}>
              <Image
                source={require("../../assets/images/sad.png")}
                style={[styles.moodIcon, { marginRight: 8 }]}
                resizeMode="contain"
              />
              <View style={styles.sliderContainer}>
                <LinearGradient
                  colors={["#BEFFC3", "#06BE00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.trackBack}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={mood}
                  onValueChange={setMood}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="#059C00"
                />
              </View>
              <Image
                source={require("../../assets/images/happy.png")}
                style={[styles.moodIcon, { marginLeft: 8 }]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Set up an appointment*/}
          <Pressable
            style={styles.appointmentDisplay}
            onPress={() => router.push("/account/reminders")}
          >
            <Image
              source={require("../../assets/images/calendarPic.png")}
              style={styles.calPic}
              resizeMode="contain"
            />
            <View style={styles.appointmentText}>
              <Text style={styles.appointmentTitle}>Set up a reminder</Text>
              <Text style={styles.appointmentSubTitle}>
                Schedule a weekly meeting with your AI Coach
              </Text>
            </View>
          </Pressable>
        </View>

        {/*Habitude Card info — fixed height, sits at bottom */}
        <View style={styles.cardsDisplay}>
          <Text style={styles.cardTitle}>Learn about money habits</Text>
          <Text style={styles.cardSubtTitle}>
            Press any card for more infomation
          </Text>
          <HabitCard onSelect={openHabit} />
        </View>
        {/*Partial View*/}
        <Modal
          visible={habitOpen}
          transparent
          animationType="fade"
          onRequestClose={closeHabit}
        >
          {/* dark backdrop */}
          <Pressable style={styles.backdrop} onPress={closeHabit} />

          {/* the card */}
          <View style={styles.modalCenter}>
            <View
              style={[
                styles.habitModal,
                { borderColor: selectedHabit?.borderColor || "#000" },
              ]}
            >
              <View
                style={[
                  styles.habitModalInner,
                  { borderColor: selectedHabit?.borderColor || "#000" },
                ]}
              >
                {/* header row */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
                  <Pressable onPress={closeHabit}>
                    <Text style={styles.closeX}>×</Text>
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={selectedHabit?.image}
                    style={styles.modalIcon}
                    resizeMode="contain"
                  />

                  <Text style={styles.tagLine}>{selectedHabit?.tagLine}</Text>

                  <Text style={styles.paragraph}>
                    {selectedHabit?.description}
                  </Text>

                  <Text style={styles.sectionTitle}>Advantages</Text>
                  {selectedHabit?.advantages?.map((a: string, idx: number) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{a}</Text>
                    </View>
                  ))}

                  <Pressable style={styles.cta}>
                    <Text style={styles.ctaText}>Ask AI Coach</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation*/}
      </View>
    </LinearGradient>
  );
};
export default Dashboard;

const getStart = (date: Date) => {
  const obj = new Date(date);
  obj.setHours(0, 0, 0, 0);
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
const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  upperContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  title: {
    paddingTop: 60,
    fontSize: 36,
    fontWeight: "600",
  },
  subtitle: {
    paddingTop: 6,
    color: "#3D3D3D",
    fontSize: 14,
    fontWeight: "600",
  },
  tackle: {
    color: "#06BE00",
  },
  calendar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 20,
  },
  monthName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3D3D3D",
  },
  navBtn: {
    padding: 2,
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
    marginBottom: 6,
    fontSize: 12,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontWeight: "600",
    fontSize: 13,
  },
  blueDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3059AD",
  },
  moneyMood: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    width: "90%",
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  moneyMoodTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D3D3D",
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderContainer: {
    flex: 1,
    height: 36,
    justifyContent: "center",
  },

  trackBack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 10,
  },

  slider: {
    position: "absolute",
    left: -10,
    right: -10,
  },
  moodIcon: {
    width: 28,
    height: 28,
  },

  appointmentDisplay: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    width: "90%",
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  calPic: {
    marginRight: 12,
    width: 44,
    height: 44,
  },
  appointmentText: {
    flex: 1,
    flexDirection: "column",
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  appointmentSubTitle: {
    fontSize: 13,
    color: "#3D3D3D",
  },
  cardsDisplay: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    width: "100%",
    paddingTop: 10,
    paddingBottom: 84,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    paddingTop: 6,
    paddingBottom: 2,
  },
  cardSubtTitle: {
    fontSize: 11,
    color: "#3D3D3D",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  habitModal: {
    width: "90%",
    borderWidth: 4,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 12,
  },

  habitModalInner: {
    borderWidth: 3,
    borderRadius: 22,
    padding: 14,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
  },

  modalTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#6A6A6A",
  },

  closeX: {
    fontSize: 34,
    lineHeight: 34,
    color: "#6A6A6A",
  },

  modalBody: {
    paddingHorizontal: 8,
    paddingBottom: 14,
  },

  modalIcon: {
    width: 110,
    height: 110,
    alignSelf: "center",
    marginTop: 12,
  },

  tagLine: {
    textAlign: "center",
    fontSize: 18,
    color: "#6A6A6A",
    marginTop: 12,
    marginBottom: 12,
  },

  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#222",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bullet: {
    width: 18,
    fontSize: 18,
    lineHeight: 22,
  },

  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },

  cta: {
    marginTop: 18,
    alignSelf: "center",
    backgroundColor: "#3A7DFF",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },

  ctaText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
