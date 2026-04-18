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
import { LinearGradient } from "expo-linear-gradient";
import {
  initializeOnboardingAssessment,
  submitAnswer as submitAnswerAPI,
  submitAssessment as submitAssessmentAPI,
} from "../services/assessment.service";

// Components
import PreAssessmentView from "../components/assessment/PreAssessmentView";
import QuestionCardStack from "../components/assessment/QuestionCardStack";
import AssessmentControls from "../components/assessment/AssessmentControls";
import CompletionView from "../components/assessment/CompletionView";
import AssessmentHeader from "../components/assessment/AssessmentHeader";

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
  // Show pre-assessment onboarding screen
  const [showPreAssessment, setShowPreAssessment] = useState(true);

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
  }, [currentIndex, position, dragProgress]);

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

          if (
            mappedQuestions.length > 0 &&
            firstUnanswered >= mappedQuestions.length
          ) {
            // All questions answered, show completion screen
            setCompleted(true);
            setCurrentIndex(mappedQuestions.length - 1);
            setFurthestIndex(mappedQuestions.length);
            setShowPreAssessment(false);
          } else {
            setCurrentIndex(firstUnanswered);
            setFurthestIndex(
              Math.max(firstUnanswered, data.previously_answered.length),
            );
            // Bypass pre-assessment screen if we have previous answers
            setShowPreAssessment(false);
          }
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
      </SafeAreaView>
    );
  }

  // ── Pre-Assessment Screen ──────────────────────────────────────────────

  if (showPreAssessment) {
    return <PreAssessmentView onStart={() => setShowPreAssessment(false)} />;
  }

  // ── Completion Screen ──────────────────────────────────────────────────

  if (completed) {
    return (
      <CompletionView
        onFinish={() =>
          sessionIdRef.current && handleSubmitAssessment(sessionIdRef.current)
        }
        colors={COLORS}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const progressPercent =
    totalQuestions > 0
      ? (Math.max(furthestIndex, currentIndex) / totalQuestions) * 100
      : 0;

  const LogoBadge = ({ style }: { style?: object }) => (
    <Image
      source={require("../assets/images/MH_cards.png")}
      style={[{ width: 32, height: 32, resizeMode: "contain" }, style]}
    />
  );

  return (
    <LinearGradient
      colors={["#DCE9F2", "#E8F0F7", "#F9FAFC"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <AssessmentHeader
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            progressPercent={progressPercent}
            onBack={goBack}
            canBack={currentIndex > 0}
            colors={COLORS}
          />

          <Text style={styles.subtitle}>How well does this describe you?</Text>
        </View>

        <QuestionCardStack
          questions={questions}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          position={position}
          dragProgress={dragProgress}
          panResponder={panResponder}
          rotate={rotate}
          isRevisiting={isRevisiting}
          frontBorderColor={
            CARD_BORDER_COLORS[currentIndex % CARD_BORDER_COLORS.length]
          }
          middleBorderColor={
            CARD_BORDER_COLORS[(currentIndex + 1) % CARD_BORDER_COLORS.length]
          }
          backBorderColor={
            CARD_BORDER_COLORS[(currentIndex + 2) % CARD_BORDER_COLORS.length]
          }
          back3BorderColor={
            CARD_BORDER_COLORS[(currentIndex + 3) % CARD_BORDER_COLORS.length]
          }
          LogoBadge={LogoBadge}
        />

        <AssessmentControls
          handleButton={handleButton}
          currentAnswer={currentAnswer}
          leftOpacity={leftOpacity}
          rightOpacity={rightOpacity}
          upOpacity={upOpacity}
          btnNotMeScale={btnNotMeScale}
          btnThatsMeScale={btnThatsMeScale}
          btnSometimesScale={btnSometimesScale}
          colors={COLORS}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16, // Reduced from 24 for compactness
  },
  topSection: {
    width: "100%",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.textPrimary,
    marginTop: 8, // Reduced from 12
    marginBottom: 12, // Reduced from 20
    fontWeight: "600",
    letterSpacing: -0.2,
  },
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  errorBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
