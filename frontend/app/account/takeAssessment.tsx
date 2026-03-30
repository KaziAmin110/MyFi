import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  initializeOnboardingAssessment,
  submitAnswer as submitAnswerAPI,
  submitAssessment as submitAssessmentAPI,
} from "../../services/assessment.service";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  category?: string;
}

type Answer = "not_me" | "sometimes" | "thats_me";

interface CardAnswer {
  questionId: string;
  answer: Answer;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * (443 / 336);

const CARD_BORDER_COLORS = [
  "#43A047",
  "#1E88E5",
  "#E53935",
  "#FFD600",
  "#8E24AA",
];

// Maps a swipe answer to the numeric value the backend expects
function answerToValue(answer: Answer): number {
  switch (answer) {
    case "not_me":
      return -1;
    case "sometimes":
      return 0;
    case "thats_me":
      return 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const LogoBadge = ({ style }: { style?: object }) => (
  <Image
    source={require("../../assets/images/MH_cards.png")}
    style={[styles.logoBadge, style]}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AssessmentScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setAnswers] = useState<CardAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Session ID returned by the backend
  const sessionIdRef = useRef<number | null>(null);

  // Fresh position per card
  const positionMap = useRef<Record<number, Animated.ValueXY>>({});
  if (!positionMap.current[currentIndex]) {
    positionMap.current[currentIndex] = new Animated.ValueXY();
  }
  const position = positionMap.current[currentIndex];
  const positionRef = useRef(position);
  positionRef.current = position;

  // Refs for latest values so panResponder never reads stale state
  const currentIndexRef = useRef(currentIndex);
  const questionsRef = useRef(questions);
  const totalQuestionsRef = useRef(questions.length);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    position.setValue({ x: 0, y: 0 });
  }, [currentIndex, position]);

  useEffect(() => {
    questionsRef.current = questions;
    totalQuestionsRef.current = questions.length;
  }, [questions]);

  // Derived swipe colors
  const leftOpacity = positionRef.current.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rightOpacity = positionRef.current.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const upOpacity = positionRef.current.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Button scales that react to drag direction
  const btnNotMeScale = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1.25, 1],
    extrapolate: "clamp",
  });
  const btnThatsMeScale = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [1, 1.25],
    extrapolate: "clamp",
  });
  const btnSometimesScale = positionRef.current.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1.25, 1],
    extrapolate: "clamp",
  });

  // ── Load from backend ──────────────────────────────────────────────────

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const data = await initializeOnboardingAssessment();

        sessionIdRef.current = data.session_id;

        // Map backend questions to our Question shape
        const mappedQuestions: Question[] = data.questions.map((q) => ({
          id: String(q.question_id),
          text: q.text,
          category: q.habitude_type,
        }));

        setQuestions(mappedQuestions);

        // If resuming, figure out where we left off
        if (data.previously_answered && data.previously_answered.length > 0) {
          const resumeIndex = data.previously_answered.length;
          setCurrentIndex(resumeIndex);

          // Rebuild local answers for tracking
          const resumedAnswers: CardAnswer[] = data.previously_answered.map(
            (pa) => ({
              questionId: String(pa.question_id),
              answer:
                pa.answer_value === -1
                  ? "not_me"
                  : pa.answer_value === 0
                  ? "sometimes"
                  : "thats_me",
            })
          );
          setAnswers(resumedAnswers);
        }
      } catch (err: any) {
        console.error("Failed to load onboarding assessment:", err);
        setLoadError(err.message || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, []);

  const totalQuestions = questions.length;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });

  // ── Answer & submission logic ──────────────────────────────────────────

  const recordAnswerRef = useRef<(answer: Answer) => void>(undefined);
  const swipeCardRef =
    useRef<(answer: Answer, toX: number, toY: number) => void>(undefined);

  recordAnswerRef.current = (answer: Answer) => {
    const idx = currentIndexRef.current;
    const qs = questionsRef.current;
    const total = totalQuestionsRef.current;
    const question = qs[idx];
    if (!question) return;

    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.error("No session ID available");
      return;
    }

    // Submit answer to backend (fire-and-forget for UX speed)
    submitAnswerAPI(sessionId, question.id, answerToValue(answer)).catch(
      (err) => console.error("Failed to submit answer:", err)
    );

    setAnswers((prev) => {
      const newAnswers = [...prev, { questionId: question.id, answer }];
      return newAnswers;
    });

    if (idx + 1 < total) {
      setCurrentIndex(idx + 1);
    } else {
      // All questions answered — submit the assessment
      handleSubmitAssessment(sessionId);
    }
  };

  const handleSubmitAssessment = async (sessionId: number) => {
    setSubmitting(true);
    try {
      await submitAssessmentAPI(sessionId);
      // Navigate to results or dashboard
      router.replace("/account/dashboard");
    } catch (err: any) {
      console.error("Failed to submit assessment:", err);
      // Still navigate — the answers are saved, submission can be retried
      router.replace("/account/dashboard");
    }
  };

  swipeCardRef.current = (answer: Answer, toX: number, toY: number) => {
    Animated.timing(positionRef.current, {
      toValue: { x: toX, y: toY },
      duration: 250,
      useNativeDriver: false,
    }).start(() => recordAnswerRef.current?.(answer));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        positionRef.current.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCardRef.current?.("not_me", -SCREEN_WIDTH * 1.5, 0);
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCardRef.current?.("thats_me", SCREEN_WIDTH * 1.5, 0);
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          swipeCardRef.current?.("sometimes", 0, -SCREEN_HEIGHT);
        } else {
          Animated.spring(positionRef.current, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  // Public wrappers used by the buttons
  const swipeCard = (answer: Answer, toX: number, toY: number) =>
    swipeCardRef.current?.(answer, toX, toY);

  const handleButton = (answer: Answer) => {
    if (answer === "not_me") swipeCard(answer, -SCREEN_WIDTH * 1.5, 0);
    if (answer === "thats_me") swipeCard(answer, SCREEN_WIDTH * 1.5, 0);
    if (answer === "sometimes") swipeCard(answer, 0, -SCREEN_HEIGHT);
  };

  // ── Loading & Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={{ marginTop: 12, color: "#888" }}>
          Loading questions...
        </Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ color: "#E53935", fontSize: 16, textAlign: "center", paddingHorizontal: 32 }}>
          {loadError}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: "#1E88E5", borderRadius: 10 }}
          onPress={() => router.replace("/account/dashboard")}
        >
          <Text style={{ color: "#FFF", fontWeight: "600" }}>Go to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (submitting) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#43A047" />
        <Text style={{ marginTop: 12, color: "#888" }}>
          Submitting your assessment...
        </Text>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const progressPercent =
    totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const frontBorderColor =
    CARD_BORDER_COLORS[currentIndex % CARD_BORDER_COLORS.length];
  const middleBorderColor =
    CARD_BORDER_COLORS[(currentIndex + 1) % CARD_BORDER_COLORS.length];
  const backBorderColor =
    CARD_BORDER_COLORS[(currentIndex + 2) % CARD_BORDER_COLORS.length];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <Text style={styles.questionCount}>
          Question {currentIndex + 1} of {totalQuestions}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
        />
      </View>

      <Text style={styles.subtitle}>How well does this describe you?</Text>

      {/* ── Card Stack ── */}
      <View style={styles.cardContainer}>
        {/* Back card */}
        {currentIndex + 2 < totalQuestions && (
          <View
            style={[
              styles.card,
              styles.cardBack2,
              { borderColor: backBorderColor },
            ]}
          >
            <LogoBadge style={styles.logoTopLeft} />
            <View style={[styles.cardTextContainer, { top: 0 }]}>
              <Text style={styles.cardText}>
                {questions[currentIndex + 2]?.text}
              </Text>
            </View>
            <LogoBadge style={styles.logoBottomRight} />
          </View>
        )}

        {/* Middle card */}
        {currentIndex + 1 < totalQuestions && (
          <View
            style={[
              styles.card,
              styles.cardBack1,
              { borderColor: middleBorderColor },
            ]}
          >
            <LogoBadge style={styles.logoTopLeft} />
            <View style={[styles.cardTextContainer, { top: 0 }]}>
              <Text style={styles.cardText}>
                {questions[currentIndex + 1]?.text}
              </Text>
            </View>
            <LogoBadge style={styles.logoBottomRight} />
          </View>
        )}

        {/* Front / active card */}
        <Animated.View
          key={currentIndex}
          style={[
            styles.card,
            styles.cardFront,
            { borderColor: frontBorderColor },
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <LogoBadge style={styles.logoTopLeft} />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardText}>{questions[currentIndex]?.text}</Text>
          </View>
          <LogoBadge style={styles.logoBottomRight} />
        </Animated.View>
      </View>

      {/* ── Labels ── */}
      <View style={styles.labelsRow}>
        <Animated.View
          style={[styles.label, styles.labelNotMe, { opacity: leftOpacity }]}
        >
          <Text style={styles.labelTextRed}>Not me!</Text>
        </Animated.View>

        <Animated.View
          style={[styles.label, styles.labelSometimes, { opacity: upOpacity }]}
        >
          <Text style={styles.labelTextYellow}>Sometimes</Text>
        </Animated.View>

        <Animated.View
          style={[styles.label, styles.labelThatsMe, { opacity: rightOpacity }]}
        >
          <Text style={styles.labelTextGreen}>That&apos;s me!</Text>
        </Animated.View>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.optionsContainer}>
        <Image
          source={require("../../assets/images/Options.png")}
          style={styles.optionsBg}
          resizeMode="stretch"
        />
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            onPress={() => handleButton("not_me")}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.actionBtn,
                styles.btnNotMe,
                {
                  transform: [{ scale: btnNotMeScale }],
                  backgroundColor: leftOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#FFFFFF", "#E53935"],
                  }),
                },
              ]}
            >
              <Animated.Image
                source={require("../../assets/images/X_Mark_Red.png")}
                style={[
                  styles.btnImg,
                  { opacity: Animated.subtract(1, leftOpacity) },
                ]}
              />
              <Animated.Image
                source={require("../../assets/images/X_Mark_White.png")}
                style={[
                  styles.btnImg,
                  styles.btnImgOverlay,
                  { opacity: leftOpacity },
                ]}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleButton("sometimes")}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.actionBtn,
                styles.btnSometimes,
                {
                  transform: [{ scale: btnSometimesScale }],
                  backgroundColor: upOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#FFFFFF", "#F5A623"],
                  }),
                },
              ]}
            >
              <Animated.Image
                source={require("../../assets/images/Qeustion_Mark_Yellow.png")}
                style={[
                  styles.btnImg,
                  { opacity: Animated.subtract(1, upOpacity) },
                ]}
              />
              <Animated.Image
                source={require("../../assets/images/Question_Mark_White.png")}
                style={[
                  styles.btnImg,
                  styles.btnImgOverlay,
                  { opacity: upOpacity },
                ]}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleButton("thats_me")}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.actionBtn,
                styles.btnThatsMe,
                {
                  transform: [{ scale: btnThatsMeScale }],
                  backgroundColor: rightOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#FFFFFF", "#43A047"],
                  }),
                },
              ]}
            >
              <Animated.Image
                source={require("../../assets/images/Check_Mark_Green.png")}
                style={[
                  styles.btnImg,
                  { opacity: Animated.subtract(1, rightOpacity) },
                ]}
              />
              <Animated.Image
                source={require("../../assets/images/Check_Mark_White.png")}
                style={[
                  styles.btnImg,
                  styles.btnImgOverlay,
                  { opacity: rightOpacity },
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>← Swipe left, right, or up to answer →</Text>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4FA",
    alignItems: "center",
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { width: 36 },
  backArrow: { fontSize: 22, color: "#333" },
  questionCount: { fontSize: 14, fontWeight: "600", color: "#444" },

  // ── Progress Bar ─────────────────────────────────────────────────────────
  progressBarBg: {
    width: "88%",
    height: 8,
    backgroundColor: "#DDE3EE",
    borderRadius: 4,
    marginBottom: 14,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#43A047",
    borderRadius: 4,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
    fontWeight: "500",
  },

  // ── Card Stack ───────────────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 20,
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  cardFront: {
    zIndex: 10,
    top: 24,
  },

  cardBack1: {
    zIndex: 5,
    top: -2,
    width: CARD_WIDTH * 0.86,
    height: CARD_HEIGHT * 0.86,
  },
  cardBack2: {
    zIndex: 1,
    top: -26,
    width: CARD_WIDTH * 0.74,
    height: CARD_HEIGHT * 0.74,
  },

  cardTextContainer: {
    position: "absolute",
    width: CARD_WIDTH - 80,
    alignSelf: "center",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
    lineHeight: 38,
  },

  logoBadge: {
    width: 38,
    height: 38,
    resizeMode: "contain",
  },
  logoTopLeft: {
    position: "absolute",
    top: 16,
    left: 16,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },

  // ── Swipe overlays ───────────────────────────────────────────────────────
  swipeOverlay: {
    position: "absolute",
    top: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: 8,
    zIndex: 20,
  },
  swipeOverlayLeft: {
    left: 20,
    borderColor: "#E53935",
    backgroundColor: "rgba(229,57,53,0.08)",
    transform: [{ rotate: "-8deg" }],
  },
  swipeOverlayRight: {
    right: 20,
    borderColor: "#43A047",
    backgroundColor: "rgba(67,160,71,0.08)",
    transform: [{ rotate: "8deg" }],
  },
  swipeOverlayText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },

  // ── Labels ───────────────────────────────────────────────────────────────
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "77%",
    marginBottom: 10,
  },
  label: {
    borderWidth: 2.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: "center",
  },
  labelNotMe: {
    borderColor: "#E53935",
    transform: [{ rotate: "-8deg" }],
    width: 74,
  },
  labelSometimes: {
    borderColor: "#FFD600",
    transform: [{ rotate: "0deg" }],
    width: 90,
  },
  labelThatsMe: {
    borderColor: "#43A047",
    transform: [{ rotate: "8deg" }],
    width: 74,
  },
  labelTextRed: {
    color: "#E53935",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  labelTextYellow: {
    color: "#F9A825",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  labelTextGreen: {
    color: "#43A047",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  optionsContainer: {
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionsBg: {
    position: "absolute",
    width: "100%",
    height: 90,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "86%",
    paddingHorizontal: 8,
    height: 90,
  },

  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  btnNotMe: { backgroundColor: "#FFFFFF", marginLeft: -16, marginTop: 5 },
  btnSometimes: { backgroundColor: "#FFFFFF", marginLeft: -15, marginTop: -30 },
  btnThatsMe: { backgroundColor: "#FFFFFF", marginRight: -20, marginTop: 5 },
  btnIcon: { fontSize: 22, color: "#FFF", fontWeight: "bold" },
  btnImg: { width: 28, height: 28, resizeMode: "contain" },
  btnImgOverlay: { position: "absolute" },

  hint: { fontSize: 12, color: "#AAA", marginBottom: 20 },
});
