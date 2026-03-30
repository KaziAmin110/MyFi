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

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  category?: string;
}

export async function fetchQuestions(): Promise<Question[]> {
  return PLACEHOLDER_QUESTIONS;
}

const PLACEHOLDER_QUESTIONS: Question[] = [
  { id: "1", text: "I plan for emergencies so I'm not caught off guard." },
  { id: "2", text: "Financial setbacks make me doubt my ability to recover." },
  { id: "3", text: "I think people will only like me if I am giving." },
  { id: "4", text: "I feel uneasy unless my money is completely secure." },
  { id: "5", text: "I spend a lot on others but I don't spend on myself." },
  { id: "6", text: "I avoid checking my bank balance when I'm stressed." },
  { id: "7", text: "I feel guilty spending money on myself." },
  { id: "8", text: "I believe I will always have enough money." },
  { id: "9", text: "I tend to overspend when I'm feeling emotional." },
  { id: "10", text: "I feel more confident when I have a financial cushion." },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

// Figma spec: 336×443 — keep this ratio
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * (443 / 336); // ~1.318 aspect ratio

// Border colors per card slot: front, middle, back
// Figma shows: green (active "That's me" state), blue (middle), red (back)
// At rest the front card uses the CARD_BORDER_COLORS cycling array
const CARD_BORDER_COLORS = [
  "#43A047",
  "#1E88E5",
  "#E53935",
  "#FFD600",
  "#8E24AA",
];

type Answer = "not_me" | "sometimes" | "thats_me";

interface CardAnswer {
  questionId: string;
  answer: Answer;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setAnswers] = useState<CardAnswer[]>([]);

  // Fresh position per card — when currentIndex changes, the Animated.View
  // gets a new key so React fully unmounts it, and positionMap always starts at 0,0
  const positionMap = useRef<Record<number, Animated.ValueXY>>({});
  if (!positionMap.current[currentIndex]) {
    positionMap.current[currentIndex] = new Animated.ValueXY();
  }
  const position = positionMap.current[currentIndex];
  const positionRef = useRef(position);
  positionRef.current = position;

  // Refs that always hold the latest values so the panResponder (created once,
  // never recreated) never reads stale state from its closure.
  const currentIndexRef = useRef(currentIndex);
  const questionsRef = useRef(questions);
  const totalQuestionsRef = useRef(questions.length);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    // Reset position here — this fires after React has fully committed the
    // new card content to screen, so the old card is guaranteed gone
    position.setValue({ x: 0, y: 0 });
  }, [currentIndex, position]);
  useEffect(() => {
    questionsRef.current = questions;
    totalQuestionsRef.current = questions.length;
  }, [questions]);

  // Derived swipe colors shown on the card overlay as you drag
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

  // Upward drag — shows white question mark as card moves up
  const upOpacity = positionRef.current.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Button background colors that react to drag direction
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

  useEffect(() => {
    fetchQuestions()
      .then((q) => setQuestions(q))
      .catch((err) => console.error("Failed to load questions:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalQuestions = questions.length;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });

  // Mutable refs so panResponder can always call the latest version of these
  // functions without being recreated itself.
  const recordAnswerRef = useRef<(answer: Answer) => void>(undefined);
  const swipeCardRef =
    useRef<(answer: Answer, toX: number, toY: number) => void>(undefined);

  recordAnswerRef.current = (answer: Answer) => {
    const idx = currentIndexRef.current;
    const qs = questionsRef.current;
    const total = totalQuestionsRef.current;
    const question = qs[idx];
    if (!question) return;

    setAnswers((prev) => {
      const newAnswers = [...prev, { questionId: question.id, answer }];
      if (idx + 1 >= total) {
        setTimeout(
          () =>
            alert(
              "Assessment complete! " +
                newAnswers.length +
                " answers recorded.",
            ),
          0,
        );
      }
      return newAnswers;
    });

    if (idx + 1 < total) {
      setCurrentIndex(idx + 1);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
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
        {/* Back card — furthest behind, shows question after next */}
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

        {/* Middle card — next question fully rendered and waiting */}
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

        {/* Front / active card — key forces full remount per card so position is always fresh */}
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
          {/* Swipe hint overlays */}

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
    // Shadow for depth
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

  // FIX: Stack offsets now match the Figma visual (offset up-left, slightly
  //      smaller, slightly transparent) — was translateX: -10/-20 before.
  //      Figma stacks shift cards UP and slightly to the right.
  // Use `top` instead of translateY so the card's internal coordinate system
  // doesn't shift — translateY moves the whole card including its origin,
  // which means the text appears higher on back cards than front cards.
  // `top` just adjusts where the absolute-positioned card is painted without
  // affecting anything inside it.
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

  // FIX: Figma card text is large, bold, centered — 28px / weight 800
  // Absolutely fills the card so text is always centred at the exact same
  // position regardless of sibling count (overlays on front card, none on back)
  cardTextContainer: {
    position: "absolute",
    // Fixed width matching the front card so text wraps identically
    // on back cards even though those cards are physically smaller
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

  // FIX: Logos are absolutely positioned in both corners — was missing
  //      bottom-right in some versions, and size was too small
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

  // FIX: Buttons are now 52×52 (closer to Figma's ~50dp circles)
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
