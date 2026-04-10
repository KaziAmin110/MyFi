import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
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

const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.25;
// Container height: paddingTop(28) + front card translateY + card height + safe buffers
const CARD_CONTAINER_HEIGHT = CARD_HEIGHT + 70;

const COLORS = {
  primary: "#3059AD",
  green: "#34C759", // Modern Apple green
  red: "#FF3B30", // Modern Apple red
  yellow: "#FFCC00",
  bg: "#F9FAFC", // Clean off-white
  textPrimary: "#1C1C1E", // Dark high-contrast for readability
  textSecondary: "#8E8E93",
};

const CARD_BORDER_COLORS = [
  "#3A8F3F", // Green
  "#21428F", // Blue
  "#C81220", // Red
  "#E5A800", // Yellow
  "#7B1FA2", // Purple
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

  useLayoutEffect(() => {
    currentIndexRef.current = currentIndex;
    position.setValue({ x: 0, y: 0 });
    dragProgress.setValue(0);
  }, [currentIndex]);

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
          setFurthestIndex(
            Math.max(firstUnanswered, data.previously_answered.length),
          );
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

        <View style={styles.topProgressContainer}>
          <Text style={styles.questionCountText}>
            QUESTION {totalQuestions} OF {totalQuestions}
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "100%" }]} />
          </View>
        </View>

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
  const back3BorderColor =
    CARD_BORDER_COLORS[(currentIndex + 3) % CARD_BORDER_COLORS.length];

  // Back card animated styles — driven by drag progress (0 = resting, 1 = swiped)
  // Instead of updating width/height (which causes layout reflows), we use transforms for silky smooth 60fps animations
  const back1Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const back1TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });
  const back1Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const back2Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0.95],
  });
  const back2TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-32, -16],
  });
  const back2Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0.9],
  });

  const back3Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 0.9],
  });
  const back3TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, -32],
  });
  // 3rd back card fades in from nothing as the front card is dragged
  const back3Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  // Smoothly animate back card text from back-card size to front-card size
  const backCardTextScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
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
          {currentIndex > 0 && <Text style={styles.backArrow}>‹</Text>}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Money Habitudes</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.topProgressContainer}>
        <Text style={styles.questionCountText}>
          QUESTION {currentIndex + 1} OF {totalQuestions}
        </Text>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      <Text style={styles.subtitle}>How well does this describe you?</Text>

      {/* ── Card Stack ── */}
      <View style={styles.cardContainer}>
        {/* 3rd back card — invisible at rest, fades in during swipe */}
        {currentIndex + 3 < totalQuestions && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBack2,
              {
                borderColor: back3BorderColor,
                shadowColor: back3BorderColor,
                opacity: back3Opacity,
                transform: [
                  { scale: back3Scale },
                  { translateY: back3TranslateY },
                ],
              },
            ]}
          />
        )}

        {/* Back card */}
        {currentIndex + 2 < totalQuestions && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBack2,
              {
                borderColor: backBorderColor,
                shadowColor: backBorderColor,
                opacity: back2Opacity,
                transform: [
                  { scale: back2Scale },
                  { translateY: back2TranslateY },
                ],
              },
            ]}
          />
        )}

        {/* Middle card — shows next question and animates toward front as card is dragged */}
        {currentIndex + 1 < totalQuestions && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBack1,
              {
                borderColor: middleBorderColor,
                shadowColor: middleBorderColor,
                opacity: back1Opacity,
                transform: [
                  { scale: back1Scale },
                  { translateY: back1TranslateY },
                ],
              },
            ]}
          >
            <View style={styles.cardContentWrapper}>
              <LogoBadge style={styles.logoBadgeCenter} />
              <Animated.View
                style={[
                  styles.cardTextContainer,
                  { transform: [{ scale: backCardTextScale }] },
                ]}
              >
                <Text style={styles.cardText}>
                  {questions[currentIndex + 1]?.text}
                </Text>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Front / active card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            {
              borderColor: frontBorderColor,
              shadowColor: frontBorderColor,
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Revisiting badge */}
          {isRevisiting && (
            <View style={styles.revisitBadge}>
              <Text style={styles.revisitBadgeText}>PREVIOUSLY ANSWERED</Text>
            </View>
          )}

          <View style={styles.cardContentWrapper}>
            <LogoBadge style={styles.logoBadgeCenter} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardText}>
                {questions[currentIndex]?.text}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.buttonsSection}>
        {/* Not Me */}
        <TouchableOpacity
          onPress={() => handleButton("not_me")}
          activeOpacity={0.8}
          style={styles.actionItem}
        >
          <Animated.View
            style={[
              styles.actionBtn,
              {
                transform: [{ scale: btnNotMeScale }],
                backgroundColor:
                  currentAnswer === "not_me"
                    ? COLORS.red
                    : leftOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#FFFFFF", COLORS.red],
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
          <Text style={[styles.btnLabel, { color: COLORS.red }]}>NOT ME</Text>
        </TouchableOpacity>

        {/* Sometimes */}
        <TouchableOpacity
          onPress={() => handleButton("sometimes")}
          activeOpacity={0.8}
          style={[styles.actionItem, { marginTop: 12 }]} // Displace middle button slightly downward for aesthetic curve
        >
          <Animated.View
            style={[
              styles.actionBtn,
              {
                transform: [{ scale: btnSometimesScale }],
                backgroundColor:
                  currentAnswer === "sometimes"
                    ? COLORS.yellow
                    : upOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#FFFFFF", COLORS.yellow],
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
          <Text style={[styles.btnLabel, { color: COLORS.yellow }]}>
            SOMETIMES
          </Text>
        </TouchableOpacity>

        {/* That's Me */}
        <TouchableOpacity
          onPress={() => handleButton("thats_me")}
          activeOpacity={0.8}
          style={styles.actionItem}
        >
          <Animated.View
            style={[
              styles.actionBtn,
              {
                transform: [{ scale: btnThatsMeScale }],
                backgroundColor:
                  currentAnswer === "thats_me"
                    ? COLORS.green
                    : rightOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#FFFFFF", COLORS.green],
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
          <Text style={[styles.btnLabel, { color: COLORS.green }]}>
            THAT&apos;S ME
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 32,
    color: COLORS.textPrimary,
    fontWeight: "300",
    marginTop: -2,
  },

  // ── Progress Bar ─────────────────────────────────────────────────────────
  topProgressContainer: {
    width: "100%",
    paddingHorizontal: 32,
    marginBottom: 8,
    alignItems: "center",
  },
  questionCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  progressBarBg: {
    width: "100%",
    height: 5,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
  },
  progressBarFill: {
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  subtitle: {
    fontSize: 20,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
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
    borderRadius: 28,
    position: "absolute",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 4.5,
  },

  cardFront: {
    zIndex: 10,
    top: 24,
  },

  cardBack1: {
    zIndex: 5,
    top: 24,
  },
  cardBack2: {
    zIndex: 1,
    top: 24,
  },

  cardContentWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardTextContainer: {
    position: "absolute",
    width: CARD_WIDTH - 64,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    color: COLORS.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  logoBadge: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  logoBadgeCenter: {
    position: "absolute",
    top: 28,
    alignSelf: "center",
    opacity: 0.8,
  },

  // ── Revisiting badge ──────────────────────────────────────────────────
  revisitBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 30,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  revisitBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  buttonsSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    gap: 32, // Gives clean space between the floating buttons
  },
  actionItem: {
    alignItems: "center",
  },

  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  btnImg: { width: 34, height: 34, resizeMode: "contain" },
  btnImgOverlay: { position: "absolute" },
  btnLabel: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.5,
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
