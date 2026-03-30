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
} from "../services/assessment.service";

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

const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * (420 / 336);

const CARD_BORDER_COLORS = [
  "#43A047",
  "#1E88E5",
  "#E53935",
  "#FFD600",
  "#8E24AA",
];

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
    source={require("../assets/images/MH_cards.png")}
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

  const sessionIdRef = useRef<number | null>(null);

  const positionMap = useRef<Record<number, Animated.ValueXY>>({});
  if (!positionMap.current[currentIndex]) {
    positionMap.current[currentIndex] = new Animated.ValueXY();
  }
  const position = positionMap.current[currentIndex];
  const positionRef = useRef(position);
  positionRef.current = position;

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

  // Swipe opacities
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

  // Button scales
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

        const mappedQuestions: Question[] = data.questions.map((q) => ({
          id: String(q.question_id),
          text: q.text,
          category: q.habitude_type,
        }));

        setQuestions(mappedQuestions);

        if (data.previously_answered && data.previously_answered.length > 0) {
          const resumeIndex = data.previously_answered.length;
          setCurrentIndex(resumeIndex);

          const resumedAnswers: CardAnswer[] = data.previously_answered.map(
            (pa) => ({
              questionId: String(pa.question_id),
              answer:
                pa.answer_value === -1
                  ? "not_me"
                  : pa.answer_value === 0
                    ? "sometimes"
                    : "thats_me",
            }),
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

    submitAnswerAPI(sessionId, question.id, answerToValue(answer)).catch(
      (err) => console.error("Failed to submit answer:", err),
    );

    setAnswers((prev) => {
      const newAnswers = [...prev, { questionId: question.id, answer }];
      return newAnswers;
    });

    if (idx + 1 < total) {
      setCurrentIndex(idx + 1);
    } else {
      handleSubmitAssessment(sessionId);
    }
  };

  const handleSubmitAssessment = async (sessionId: number) => {
    setSubmitting(true);
    try {
      await submitAssessmentAPI(sessionId);
      router.replace("/account/dashboard");
    } catch (err: any) {
      console.error("Failed to submit assessment:", err);
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
        <ActivityIndicator size="large" color="#3059AD" />
        <Text style={styles.loadingText}>Preparing your assessment...</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => router.replace("/account/dashboard")}
        >
          <Text style={styles.errorBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (submitting) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#43A047" />
        <Text style={styles.loadingText}>Submitting your assessment...</Text>
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
        <Text style={styles.headerTitle}>Money Habitudes Assessment</Text>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
        />
      </View>
      <Text style={styles.questionCount}>
        Question {currentIndex + 1} of {totalQuestions}
      </Text>

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
          />
        )}

        {/* Middle card */}
        {currentIndex + 1 < totalQuestions && (
          <View
            style={[
              styles.card,
              styles.cardBack1,
              { borderColor: middleBorderColor },
            ]}
          />
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
          {/* Swipe direction overlays */}
          <Animated.View
            style={[
              styles.swipeHint,
              styles.swipeHintLeft,
              { opacity: leftOpacity },
            ]}
          >
            <Text style={styles.swipeHintTextRed}>✕</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.swipeHint,
              styles.swipeHintRight,
              { opacity: rightOpacity },
            ]}
          >
            <Text style={styles.swipeHintTextGreen}>✓</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.swipeHint,
              styles.swipeHintUp,
              { opacity: upOpacity },
            ]}
          >
            <Text style={styles.swipeHintTextYellow}>?</Text>
          </Animated.View>

          <LogoBadge style={styles.logoTopLeft} />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardText}>{questions[currentIndex]?.text}</Text>
          </View>
          <LogoBadge style={styles.logoBottomRight} />
        </Animated.View>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.buttonsSection}>
        {/* Not Me */}
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
              source={require("../assets/images/X_Mark_Red.png")}
              style={[
                styles.btnImg,
                { opacity: Animated.subtract(1, leftOpacity) },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/X_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                { opacity: leftOpacity },
              ]}
            />
          </Animated.View>
          <Text style={[styles.btnLabel, { color: "#E53935" }]}>Not Me</Text>
        </TouchableOpacity>

        {/* Sometimes */}
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
              source={require("../assets/images/Qeustion_Mark_Yellow.png")}
              style={[
                styles.btnImg,
                { opacity: Animated.subtract(1, upOpacity) },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/Question_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                { opacity: upOpacity },
              ]}
            />
          </Animated.View>
          <Text style={[styles.btnLabel, { color: "#F5A623" }]}>Sometimes</Text>
        </TouchableOpacity>

        {/* That's Me */}
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
              source={require("../assets/images/Check_Mark_Green.png")}
              style={[
                styles.btnImg,
                { opacity: Animated.subtract(1, rightOpacity) },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/Check_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                { opacity: rightOpacity },
              ]}
            />
          </Animated.View>
          <Text style={[styles.btnLabel, { color: "#43A047" }]}>
            That&apos;s Me
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>← Swipe left, right, or up →</Text>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2E50",
    letterSpacing: -0.3,
  },
  questionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E99AE",
    marginTop: 8,
    marginBottom: 6,
  },

  // ── Progress Bar ─────────────────────────────────────────────────────────
  progressBarBg: {
    width: "88%",
    height: 6,
    backgroundColor: "#E2E7F0",
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#43A047",
    borderRadius: 3,
  },

  subtitle: {
    fontSize: 15,
    color: "#7A869A",
    marginBottom: 8,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  // ── Card Stack ───────────────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 6,
    position: "absolute",
    shadowColor: "#1A2E50",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  cardFront: {
    zIndex: 10,
  },

  cardBack1: {
    zIndex: 5,
    top: -14,
    width: CARD_WIDTH * 0.92,
    height: CARD_HEIGHT * 0.92,
    opacity: 0.7,
  },
  cardBack2: {
    zIndex: 1,
    top: -26,
    width: CARD_WIDTH * 0.84,
    height: CARD_HEIGHT * 0.84,
    opacity: 0.4,
  },

  cardTextContainer: {
    position: "absolute",
    width: CARD_WIDTH - 60,
    alignSelf: "center",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A2E50",
    lineHeight: 34,
    letterSpacing: -0.3,
  },

  logoBadge: {
    width: 32,
    height: 32,
    resizeMode: "contain",
    opacity: 0.6,
  },
  logoTopLeft: {
    position: "absolute",
    top: 14,
    left: 14,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },

  // ── Swipe hint overlays on card ────────────────────────────────────────
  swipeHint: {
    position: "absolute",
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeHintLeft: {
    top: 16,
    left: 16,
    backgroundColor: "rgba(229, 57, 53, 0.15)",
  },
  swipeHintRight: {
    top: 16,
    right: 16,
    backgroundColor: "rgba(67, 160, 71, 0.15)",
  },
  swipeHintUp: {
    top: 16,
    alignSelf: "center",
    left: CARD_WIDTH / 2 - 27, // center on card (minus border and half width)
    backgroundColor: "rgba(245, 166, 35, 0.15)",
  },
  swipeHintTextRed: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E53935",
  },
  swipeHintTextGreen: {
    fontSize: 22,
    fontWeight: "800",
    color: "#43A047",
  },
  swipeHintTextYellow: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5A623",
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  buttonsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "80%",
    paddingVertical: 12,
  },

  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1A2E50",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 2,
    alignSelf: "center",
  },
  btnNotMe: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FCDCDC",
  },
  btnSometimes: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FDE8C4",
  },
  btnThatsMe: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D4EDDA",
  },
  btnImg: { width: 26, height: 26, resizeMode: "contain" },
  btnImgOverlay: { position: "absolute" },
  btnLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.2,
  },

  hint: {
    fontSize: 12,
    color: "#B0B8C9",
    marginBottom: 16,
    fontWeight: "500",
  },

  // ── Loading / Error states ─────────────────────────────────────────────
  loadingText: {
    marginTop: 16,
    color: "#7A869A",
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "#E53935",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
    fontWeight: "500",
  },
  errorBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#3059AD",
    borderRadius: 12,
  },
  errorBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
