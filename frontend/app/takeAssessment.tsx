import React, { useState, useRef, useEffect, useCallback } from "react";
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
import ConfettiCannon from "react-native-confetti-cannon";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  category?: string;
}

type Answer = "not_me" | "sometimes" | "thats_me";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.35;
// Container height: paddingTop(28) + front card top(24) + card height + 10px buffer
const CARD_CONTAINER_HEIGHT = CARD_HEIGHT + 62;

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

function valueToAnswer(val: number): Answer {
  if (val === -1) return "not_me";
  if (val === 0) return "sometimes";
  return "thats_me";
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
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Track answers by question index — allows going back and reviewing
  const [answersMap, setAnswersMap] = useState<Record<number, Answer>>({});
  // Track the furthest question reached (for progress bar)
  const [furthestIndex, setFurthestIndex] = useState(0);

  const sessionIdRef = useRef<number | null>(null);

  // Animation position for current card
  const position = useRef(new Animated.ValueXY()).current;
  // 0→1 as front card is dragged toward swipe threshold (drives back card animations)
  const dragProgress = useRef(new Animated.Value(0)).current;

  // Refs for latest values so panResponder doesn't read stale state
  const currentIndexRef = useRef(currentIndex);
  const questionsRef = useRef(questions);
  const totalQuestionsRef = useRef(questions.length);
  const answersMapRef = useRef(answersMap);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    position.setValue({ x: 0, y: 0 });
    // Animate dragProgress to 0 smoothly so the new back card settles without snapping
    Animated.timing(dragProgress, {
      toValue: 0,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, position]);

  useEffect(() => {
    questionsRef.current = questions;
    totalQuestionsRef.current = questions.length;
  }, [questions]);

  useEffect(() => {
    answersMapRef.current = answersMap;
  }, [answersMap]);

  // Swipe opacities
  const leftOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rightOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const upOpacity = position.y.interpolate({
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
  const btnSometimesScale = position.y.interpolate({
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
          // Build a set of answered question_ids for fast lookup
          const answeredMap = new Map<string, number>();
          data.previously_answered.forEach((pa) => {
            answeredMap.set(String(pa.question_id), pa.answer_value);
          });

          // Map answers to their correct index in the questions array
          const restored: Record<number, Answer> = {};
          let firstUnanswered = mappedQuestions.length; // default: all answered

          mappedQuestions.forEach((q, idx) => {
            const val = answeredMap.get(q.id);
            if (val !== undefined) {
              restored[idx] = valueToAnswer(val);
            } else if (idx < firstUnanswered) {
              firstUnanswered = idx; // first gap
            }
          });

          setAnswersMap(restored);
          setCurrentIndex(firstUnanswered);
          setFurthestIndex(Math.max(firstUnanswered, data.previously_answered.length));
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

  const handleSubmitAssessment = useCallback(
    async (sessionId: number) => {
      setSubmitting(true);
      try {
        await submitAssessmentAPI(sessionId);
        router.replace("/account/dashboard");
      } catch (err: any) {
        console.error("Failed to submit assessment:", err);
        router.replace("/account/dashboard");
      }
    },
    [router],
  );

  const recordAnswer = useCallback(
    (answer: Answer) => {
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
        (err) => console.error("Failed to submit answer:", err),
      );

      // Save answer locally
      setAnswersMap((prev) => ({ ...prev, [idx]: answer }));

      if (idx + 1 < total) {
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        setFurthestIndex((prev) => Math.max(prev, nextIdx));
      } else {
        // All questions answered — show completion screen
        setCompleted(true);
      }
    },
    [setCompleted],
  );

  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, []);

  // ── Swipe mechanics ───────────────────────────────────────────────────

  const swipeCard = useCallback(
    (answer: Answer, toX: number, toY: number) => {
      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: toX, y: toY },
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(dragProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start(() => {
        recordAnswer(answer);
      });
    },
    [position, dragProgress, recordAnswer],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        const absDx = Math.abs(gesture.dx);
        const absDy = Math.max(0, -gesture.dy); // only upward drag counts
        const progress = Math.min(Math.max(absDx, absDy) / SWIPE_THRESHOLD, 1);
        dragProgress.setValue(progress);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            recordAnswer("not_me");
          });
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            recordAnswer("thats_me");
          });
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: 0, y: -SCREEN_HEIGHT },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            recordAnswer("sometimes");
          });
        } else {
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            Animated.spring(dragProgress, {
              toValue: 0,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const handleButton = (answer: Answer) => {
    if (answer === "not_me") swipeCard(answer, -SCREEN_WIDTH * 1.5, 0);
    if (answer === "thats_me") swipeCard(answer, SCREEN_WIDTH * 1.5, 0);
    if (answer === "sometimes") swipeCard(answer, 0, -SCREEN_HEIGHT);
  };

  // Currently selected answer for this question (if revisiting)
  const currentAnswer = answersMap[currentIndex] ?? null;
  const isRevisiting = currentAnswer !== null;

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

  // ── Completion Screen ──────────────────────────────────────────────────

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#EEF2FA" }]}>
        {/* Header with full progress */}
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Money Habitudes</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: "100%" }]} />
        </View>
        <Text style={styles.questionCount}>
          {totalQuestions} / {totalQuestions}
        </Text>

        <View style={completionStyles.content}>
          {/* Title */}
          <Text style={completionStyles.title}>Great Job! 🎉</Text>
          <Text style={completionStyles.subtitle}>
            You have completed the{"\n"}Money Habitudes Assessment!
          </Text>

          {/* Confetti area */}
          <View style={completionStyles.confettiArea}>
            {/* Decorative shapes */}
            <View style={[completionStyles.shape, completionStyles.star1]} />
            <View style={[completionStyles.shape, completionStyles.star2]} />
            <View style={[completionStyles.shape, completionStyles.star3]} />
            <View style={[completionStyles.shape, completionStyles.dot1]} />
            <View style={[completionStyles.shape, completionStyles.dot2]} />
            <View style={[completionStyles.shape, completionStyles.dot3]} />
            <View style={[completionStyles.shape, completionStyles.square1]} />
            <View style={[completionStyles.shape, completionStyles.square2]} />
            <View style={[completionStyles.shape, completionStyles.diamond1]} />
            <View style={[completionStyles.shape, completionStyles.diamond2]} />

            {/* Center illustration */}
            <Image
              source={require("../assets/images/MH_cards.png")}
              style={completionStyles.centerLogo}
            />
          </View>
        </View>

        {/* View Results button */}
        <TouchableOpacity
          style={completionStyles.viewResultsBtn}
          activeOpacity={0.85}
          onPress={() => {
            const sessionId = sessionIdRef.current;
            if (sessionId) handleSubmitAssessment(sessionId);
          }}
        >
          <Text style={completionStyles.viewResultsBtnText}>View Results</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />

        {/* Confetti cannons — placed at bottom of JSX to render on top of everything */}
        <ConfettiCannon
          count={100}
          origin={{ x: -20, y: SCREEN_HEIGHT - 100 }}
          fadeOut
          autoStart
          fallSpeed={3000}
          explosionSpeed={350}
          colors={["#3B7BF6", "#43A047", "#F5A623", "#E53935", "#8E24AA"]}
        />
        <ConfettiCannon
          count={100}
          origin={{ x: SCREEN_WIDTH + 20, y: SCREEN_HEIGHT - 100 }}
          fadeOut
          autoStart
          fallSpeed={3000}
          explosionSpeed={350}
          colors={["#3B7BF6", "#43A047", "#F5A623", "#E53935", "#8E24AA"]}
        />
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const progressPercent =
    totalQuestions > 0
      ? (Math.max(furthestIndex, currentIndex) / totalQuestions) * 100
      : 0;
  const frontBorderColor =
    CARD_BORDER_COLORS[currentIndex % CARD_BORDER_COLORS.length];
  const middleBorderColor =
    CARD_BORDER_COLORS[(currentIndex + 1) % CARD_BORDER_COLORS.length];
  const backBorderColor =
    CARD_BORDER_COLORS[(currentIndex + 2) % CARD_BORDER_COLORS.length];

  // Back card animated styles — driven by drag progress (0 = resting, 1 = swiped)
  const back1Top = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 24] });
  const back1Width = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [CARD_WIDTH * 0.92, CARD_WIDTH] });
  const back1Height = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [CARD_HEIGHT * 0.92, CARD_HEIGHT] });
  const back1Opacity = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const back2Top = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [2, 12] });
  const back2Width = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [CARD_WIDTH * 0.84, CARD_WIDTH * 0.92] });
  const back2Height = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [CARD_HEIGHT * 0.84, CARD_HEIGHT * 0.92] });
  const back2Opacity = dragProgress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  // Smoothly animate back card text from back-card size to front-card size
  const backCardTextScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [19 / 24, 1],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goBack}
          disabled={currentIndex === 0}
        >
          {currentIndex > 0 && (
            <Text style={styles.backArrow}>‹</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Money Habitudes</Text>
        <View style={styles.backBtn} />
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
          <Animated.View
            style={[
              styles.card,
              styles.cardBack2,
              { borderColor: backBorderColor },
              { top: back2Top, width: back2Width, height: back2Height, opacity: back2Opacity },
            ]}
          />
        )}

        {/* Middle card — shows next question and animates toward front as card is dragged */}
        {currentIndex + 1 < totalQuestions && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBack1,
              { borderColor: middleBorderColor },
              { top: back1Top, width: back1Width, height: back1Height, opacity: back1Opacity },
            ]}
          >
            <Animated.View style={[styles.cardTextContainer, { transform: [{ scale: backCardTextScale }] }]}>
              <Text style={styles.cardText}>
                {questions[currentIndex + 1]?.text}
              </Text>
            </Animated.View>
          </Animated.View>
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

          {/* Revisiting badge */}
          {isRevisiting && (
            <View style={styles.revisitBadge}>
              <Text style={styles.revisitBadgeText}>Previously Answered</Text>
            </View>
          )}

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
              currentAnswer === "not_me"
                ? styles.btnNotMeActive
                : styles.btnNotMe,
              {
                transform: [{ scale: btnNotMeScale }],
                backgroundColor:
                  currentAnswer === "not_me"
                    ? "#E53935"
                    : leftOpacity.interpolate({
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
                {
                  opacity:
                    currentAnswer === "not_me"
                      ? 0
                      : Animated.subtract(1, leftOpacity),
                },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/X_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                {
                  opacity: currentAnswer === "not_me" ? 1 : leftOpacity,
                },
              ]}
            />
          </Animated.View>
          <Text
            style={[
              styles.btnLabel,
              {
                color: currentAnswer === "not_me" ? "#E53935" : "#AAB2C0",
                fontWeight: currentAnswer === "not_me" ? "800" : "600",
              },
            ]}
          >
            Not Me
          </Text>
        </TouchableOpacity>

        {/* Sometimes */}
        <TouchableOpacity
          onPress={() => handleButton("sometimes")}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.actionBtn,
              currentAnswer === "sometimes"
                ? styles.btnSometimesActive
                : styles.btnSometimes,
              {
                transform: [{ scale: btnSometimesScale }],
                backgroundColor:
                  currentAnswer === "sometimes"
                    ? "#F5A623"
                    : upOpacity.interpolate({
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
                {
                  opacity:
                    currentAnswer === "sometimes"
                      ? 0
                      : Animated.subtract(1, upOpacity),
                },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/Question_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                {
                  opacity: currentAnswer === "sometimes" ? 1 : upOpacity,
                },
              ]}
            />
          </Animated.View>
          <Text
            style={[
              styles.btnLabel,
              {
                color: currentAnswer === "sometimes" ? "#F5A623" : "#AAB2C0",
                fontWeight: currentAnswer === "sometimes" ? "800" : "600",
              },
            ]}
          >
            Sometimes
          </Text>
        </TouchableOpacity>

        {/* That's Me */}
        <TouchableOpacity
          onPress={() => handleButton("thats_me")}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.actionBtn,
              currentAnswer === "thats_me"
                ? styles.btnThatsMeActive
                : styles.btnThatsMe,
              {
                transform: [{ scale: btnThatsMeScale }],
                backgroundColor:
                  currentAnswer === "thats_me"
                    ? "#43A047"
                    : rightOpacity.interpolate({
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
                {
                  opacity:
                    currentAnswer === "thats_me"
                      ? 0
                      : Animated.subtract(1, rightOpacity),
                },
              ]}
            />
            <Animated.Image
              source={require("../assets/images/Check_Mark_White.png")}
              style={[
                styles.btnImg,
                styles.btnImgOverlay,
                {
                  opacity: currentAnswer === "thats_me" ? 1 : rightOpacity,
                },
              ]}
            />
          </Animated.View>
          <Text
            style={[
              styles.btnLabel,
              {
                color: currentAnswer === "thats_me" ? "#43A047" : "#AAB2C0",
                fontWeight: currentAnswer === "thats_me" ? "800" : "600",
              },
            ]}
          >
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1A2E50",
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 32,
    color: "#3059AD",
    fontWeight: "300",
    marginTop: -2,
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
  questionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E99AE",
    marginTop: 6,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 15,
    color: "#7A869A",
    marginBottom: 6,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  // ── Card Stack ───────────────────────────────────────────────────────────
  cardContainer: {
    width: "100%",
    height: CARD_CONTAINER_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 28,
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
    top: 24,
  },

  cardBack1: {
    zIndex: 5,
    overflow: "hidden",
  },
  cardBack2: {
    zIndex: 1,
  },

  cardTextContainer: {
    position: "absolute",
    width: CARD_WIDTH - 56,
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
  cardBackText: {
    fontSize: 19,
    fontWeight: "600",
    textAlign: "center",
    color: "#1A2E50",
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  logoBadge: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    opacity: 0.5,
  },
  logoTopLeft: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },

  // ── Revisiting badge ──────────────────────────────────────────────────
  revisitBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    backgroundColor: "#3059AD",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 30,
  },
  revisitBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Swipe hint overlays on card ────────────────────────────────────────
  swipeHint: {
    position: "absolute",
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeHintLeft: {
    top: 14,
    left: 14,
    backgroundColor: "rgba(229, 57, 53, 0.15)",
  },
  swipeHintRight: {
    top: 14,
    right: 14,
    backgroundColor: "rgba(67, 160, 71, 0.15)",
  },
  swipeHintUp: {
    top: 14,
    alignSelf: "center",
    left: CARD_WIDTH / 2 - 25,
    backgroundColor: "rgba(245, 166, 35, 0.15)",
  },
  swipeHintTextRed: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E53935",
  },
  swipeHintTextGreen: {
    fontSize: 20,
    fontWeight: "800",
    color: "#43A047",
  },
  swipeHintTextYellow: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F5A623",
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  buttonsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "82%",
    paddingVertical: 10,
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
    borderColor: "#F0D0D0",
  },
  btnNotMeActive: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  btnSometimes: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5E0B8",
  },
  btnSometimesActive: {
    backgroundColor: "#F5A623",
    borderColor: "#F5A623",
  },
  btnThatsMe: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C8E6C9",
  },
  btnThatsMeActive: {
    backgroundColor: "#43A047",
    borderColor: "#43A047",
  },
  btnImg: { width: 26, height: 26, resizeMode: "contain" },
  btnImgOverlay: { position: "absolute" },
  btnLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.2,
    color: "#AAB2C0",
  },

  hint: {
    fontSize: 12,
    color: "#B0B8C9",
    marginBottom: 14,
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETION SCREEN STYLES
// ─────────────────────────────────────────────────────────────────────────────

const completionStyles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A2E50",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#7A869A",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 32,
  },

  // ── Confetti area ─────────────────────────────────────────────────────
  confettiArea: {
    width: 280,
    height: 280,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLogo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  shape: {
    position: "absolute",
  },

  // Stars (4-pointed via rotated squares)
  star1: {
    width: 18,
    height: 18,
    backgroundColor: "#B39DDB",
    borderRadius: 3,
    top: 30,
    left: 30,
    transform: [{ rotate: "45deg" }],
  },
  star2: {
    width: 14,
    height: 14,
    backgroundColor: "#FFB74D",
    borderRadius: 2,
    top: 20,
    right: 60,
    transform: [{ rotate: "45deg" }],
  },
  star3: {
    width: 16,
    height: 16,
    backgroundColor: "#4FC3F7",
    borderRadius: 3,
    bottom: 60,
    right: 30,
    transform: [{ rotate: "45deg" }],
  },

  // Dots
  dot1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F48FB1",
    top: 50,
    right: 90,
  },
  dot2: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#81C784",
    bottom: 90,
    left: 50,
  },
  dot3: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD54F",
    top: 80,
    right: 30,
  },

  // Squares
  square1: {
    width: 20,
    height: 20,
    backgroundColor: "#66BB6A",
    borderRadius: 5,
    bottom: 50,
    right: 70,
    transform: [{ rotate: "15deg" }],
  },
  square2: {
    width: 16,
    height: 16,
    backgroundColor: "#FF8A65",
    borderRadius: 4,
    top: 100,
    left: 20,
    transform: [{ rotate: "-10deg" }],
  },

  // Diamonds
  diamond1: {
    width: 14,
    height: 14,
    backgroundColor: "#CE93D8",
    borderRadius: 2,
    bottom: 30,
    left: 80,
    transform: [{ rotate: "45deg" }],
  },
  diamond2: {
    width: 12,
    height: 12,
    backgroundColor: "#4DD0E1",
    borderRadius: 2,
    top: 40,
    left: 100,
    transform: [{ rotate: "45deg" }],
  },

  // ── View Results Button ─────────────────────────────────────────────
  viewResultsBtn: {
    width: "80%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#3B7BF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B7BF6",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  viewResultsBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
