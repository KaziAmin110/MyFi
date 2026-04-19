import {
  Text,
  View,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Slider from "@react-native-community/slider";
import * as SecureStore from "expo-secure-store";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import HabitCard from "../../components/HabitCard";
import { Ionicons } from "@expo/vector-icons";
import { appointmentsApi } from "../../utils/api";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";
import * as Haptics from "expo-haptics";

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
  const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDates = weekInfo(anchorDate);

  const sadShake = useRef(new Animated.Value(0)).current;
  const happyShake = useRef(new Animated.Value(0)).current;
  const sadScale = useRef(new Animated.Value(1)).current;
  const happyScale = useRef(new Animated.Value(1)).current;
  const sliderVal = useRef(50);
  const lastZone = useRef<"sad" | "middle" | "happy">("middle");

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitOpen, setHabitOpen] = useState(false);
  const pendingHabitude = useRef<string | null>(null);

  // ── Swipe-to-close gesture ──────────────────
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  // Reset position every time the modal opens
  useEffect(() => {
    if (habitOpen) {
      modalTranslateY.setValue(0);
    }
  }, [habitOpen, modalTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) modalTranslateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          // Fast dismiss — slide the sheet out first, then close
          Animated.timing(modalTranslateY, {
            toValue: 800,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            modalTranslateY.setValue(0);
            setHabitOpen(false);
            setSelectedHabit(null);
          });
        } else {
          // Not far enough — snap back
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    }),
  ).current;

  const doShake = (rotation: Animated.Value, scale: Animated.Value) => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.75,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -0.5,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleMoodChange = (value: number) => {
    sliderVal.current = value;
    let currentZone: "sad" | "middle" | "happy" = "middle";

    if (value <= 25) currentZone = "sad";
    else if (value >= 75) currentZone = "happy";

    if (currentZone !== lastZone.current) {
      lastZone.current = currentZone;
      if (currentZone === "sad") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        doShake(sadShake, sadScale);
      }
      if (currentZone === "happy") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        doShake(happyShake, happyScale);
      }
    }
  };

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
      {/* Single non-scrollable column */}
      <View
        style={[
          styles.scroll,
          styles.scrollContent,
          {
            paddingTop: insets.top + (isTablet ? 20 : 12),
          },
        ]}
      >
        {/* ── Hero ── */}
        <View
          style={[styles.hero, { width: contentWidth, alignSelf: "center" }]}
        >
          <MaskedView
            maskElement={<Text style={styles.title}>Hey {firstName}!</Text>}
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
        </View>

        {/* ── Calendar ── */}
        <View
          style={[
            styles.calendar,
            { width: contentWidth, alignSelf: "center" },
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
              style={({ pressed }) => [
                styles.navBtn,
                pressed && { opacity: 0.5 },
              ]}
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
                      router.push({
                        pathname: "/account/reminders",
                        params: { highlightDate: dateStr },
                      });
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
                  <View
                    style={[styles.dateBubble, todayDay && styles.todayBubble]}
                  >
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

        {/* ── Money Mood ── */}
        <View
          style={[
            styles.card,
            styles.moneyMood,
            { width: contentWidth, alignSelf: "center" },
          ]}
        >
          <Text style={styles.moneyMoodTitle}>
            What is your money mood today?
          </Text>
          <View style={styles.sliderRow}>
            <Animated.Image
              source={require("../../assets/images/sad.png")}
              style={[
                styles.moodIcon,
                { marginRight: 8 },
                {
                  transform: [
                    {
                      rotate: sadShake.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ["-15deg", "15deg"],
                      }),
                    },
                    { scale: sadScale },
                  ],
                },
              ]}
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
                value={sliderVal.current}
                onValueChange={handleMoodChange}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="#059C00"
              />
            </View>
            <Animated.Image
              source={require("../../assets/images/happy.png")}
              style={[
                styles.moodIcon,
                { marginLeft: 8 },
                {
                  transform: [
                    {
                      rotate: happyShake.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ["-15deg", "15deg"],
                      }),
                    },
                    { scale: happyScale },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ── Appointment Reminder ── */}
        <Pressable
          style={[
            styles.card,
            styles.appointmentDisplay,
            { width: contentWidth, alignSelf: "center" },
          ]}
          onPress={() => router.push("/account/reminders")}
        >
          <Image
            source={require("../../assets/images/calendarPic.png")}
            style={styles.calPic}
            resizeMode="contain"
          />
          <View style={styles.appointmentText}>
            <Text style={styles.appointmentTitle}>Setup a Reminder</Text>
            <Text
              style={styles.appointmentSubTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Schedule a weekly meeting with your AI Coach
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#AAAAAA" />
        </Pressable>

        {/* ── Habit Cards Section ── */}
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

      {/* ── Habit Detail Modal ── */}
      <Modal
        visible={habitOpen}
        transparent
        animationType="slide"
        onRequestClose={closeHabit}
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
      >
        {/* Dimmed backdrop */}
        <Pressable style={styles.backdrop} onPress={closeHabit} />

        {/* Bottom sheet — swipeable */}
        <View style={styles.modalCenter}>
          <Animated.View
            style={[
              styles.habitModal,
              {
                borderColor: selectedHabit?.borderColor || "#ccc",
                transform: [{ translateY: modalTranslateY }],
                // Explicit height so flex:1 children can resolve their size
                height: height * 0.88,
              },
            ]}
          >
            {/* Drag handle — attach pan responder here so scroll still works */}
            <View style={styles.modalDragZone} {...panResponder.panHandlers}>
              <View style={styles.modalDragHandle} />

              {/* Header: [spacer] [Title] [X] */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderSpacer} />
                <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
                <Pressable
                  onPress={closeHabit}
                  style={styles.closePressable}
                  hitSlop={12}
                >
                  <Text style={styles.closeX}>×</Text>
                </Pressable>
              </View>
            </View>

            {/* Inner border wraps all body content */}
            <View
              style={[
                styles.habitModalInner,
                { borderColor: selectedHabit?.borderColor || "#ccc" },
              ]}
            >
              <ScrollView
                contentContainerStyle={[
                  styles.modalBody,
                  { paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Icon */}
                <Image
                  source={selectedHabit?.image}
                  style={styles.modalIcon}
                  resizeMode="contain"
                />

                {/* Tagline */}
                <Text style={styles.tagLine}>{selectedHabit?.tagLine}</Text>

                <Text style={styles.paragraph}>
                  {selectedHabit?.description}
                </Text>

                {/* Advantages */}
                <Text style={styles.sectionTitle}>Advantages</Text>
                {selectedHabit?.advantages?.map((a: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{a}</Text>
                  </View>
                ))}

                <View style={styles.sectionDivider} />

                {/* Disadvantages */}
                <Text style={styles.sectionTitle}>Disadvantages</Text>
                {selectedHabit?.disadvantages?.map((d: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{d}</Text>
                  </View>
                ))}

                {/* CTA */}
                <Pressable
                  style={[
                    styles.cta,
                    {
                      backgroundColor: selectedHabit?.borderColor || "#3A7DFF",
                    },
                  ]}
                  onPress={() => {
                    pendingHabitude.current = selectedHabit?.title;
                    closeHabit();
                  }}
                >
                  <Text style={styles.ctaText}>Ask AI Coach</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Dashboard;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },

  // ── Scroll container ──────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Hero (greeting) ───────────────────────
  hero: {
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(16),
  },
  title: {
    fontSize: moderateScale(34),
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#3D3D3D",
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginTop: moderateVerticalScale(4),
    marginBottom: moderateVerticalScale(2),
    textAlign: "center",
  },
  tackle: {
    color: "#06BE00",
  },

  // ── Calendar ─────────────────────────────
  calendar: {
    paddingVertical: moderateVerticalScale(6),
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateVerticalScale(24),
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateVerticalScale(6),
  },
  monthName: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#3D3D3D",
    paddingBottom: moderateVerticalScale(6),
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
    marginBottom: 4,
    fontSize: moderateScale(13),
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
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontWeight: "600",
    fontSize: moderateScale(13),
  },
  blueDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3059AD",
  },

  // ── Shared card surface ───────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // ── Money Mood card ───────────────────────
  moneyMood: {
    paddingVertical: moderateVerticalScale(16),
    paddingHorizontal: moderateScale(20),
  },
  moneyMoodTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#3D3D3D",
    marginBottom: moderateVerticalScale(10),
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
    borderRadius: 12,
  },
  slider: {
    position: "absolute",
    left: -10,
    right: -10,
  },
  moodIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
  },

  // ── Appointment card ──────────────────────
  appointmentDisplay: {
    paddingVertical: moderateVerticalScale(18),
    paddingHorizontal: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateVerticalScale(8),
  },
  calPic: {
    marginRight: moderateScale(14),
    width: moderateScale(40),
    height: moderateScale(40),
  },
  appointmentText: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginBottom: 3,
    color: "#3D3D3D",
  },
  appointmentSubTitle: {
    fontSize: moderateScale(15),
    color: "#6A6A6A",
    lineHeight: moderateScale(18),
  },

  // ── Cards section (white panel) ───────────
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
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginBottom: moderateVerticalScale(12),
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

  // ── Modal ──────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // Outer thick border — full bottom sheet
  habitModal: {
    width: "100%",
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
    // padding is handled by inner zones
  },

  // The draggable zone at the top (drag handle + header)
  modalDragZone: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },

  // Drag handle pill (inside drag zone)
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 12,
  },

  // Header: [spacer] | [centered title] | [X button]
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalHeaderSpacer: {
    width: 36, // same width as X button to keep title centered
  },
  modalTitle: {
    flex: 1,
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#3D3D3D",
    textAlign: "center",
  },
  closePressable: {
    width: 36,
    alignItems: "flex-end",
  },
  closeX: {
    fontSize: 30,
    lineHeight: 32,
    color: "#9A9A9A",
    fontWeight: "300",
  },

  // Inner thin border wrapping the body
  habitModalInner: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginHorizontal: 8,
    flexGrow: 1,
    flexShrink: 1,
    overflow: "hidden",
  },

  // Scrollable body
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    alignItems: "center",
  },

  // Icon
  modalIcon: {
    width: moderateScale(100),
    height: moderateScale(100),
    marginBottom: 12,
  },

  // Tagline — grey, centered, normal weight (matches reference)
  tagLine: {
    textAlign: "center",
    fontSize: moderateScale(15),
    color: "#6A6A6A",
    fontWeight: "400",
    lineHeight: moderateScale(22),
    marginBottom: 16,
  },

  paragraph: {
    alignSelf: "stretch",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#222",
    marginBottom: 18,

    textDecorationColor: "#3A7DFF",
    textDecorationStyle: "solid",
  },

  // Section title (Advantages / Disadvantages)
  sectionTitle: {
    alignSelf: "stretch",
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  sectionDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },

  // Bullet rows — plain bullets matching reference
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "stretch",
    marginBottom: 8,
  },
  bullet: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#3D3D3D",
    marginRight: 6,
    width: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#3D3D3D",
  },

  // CTA button — habit accent color, kept as previous design
  cta: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 50,
    marginBottom: 8,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});
