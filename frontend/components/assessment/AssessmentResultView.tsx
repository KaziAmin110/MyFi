import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  scale,
  verticalScale,
  moderateScale,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../../utils/scale";
import MultiRing from "../MultiRing";
import { HABITUDES } from "../../constants/habitudes";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { AssessmentResultsData } from "@/services/assessmentResult.service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const RING_SIZE = Math.min(SCREEN_HEIGHT * 0.28, SCREEN_WIDTH * 0.58);
const STROKE_WIDTH = RING_SIZE * 0.14; // proportional stroke

interface AssessmentResultViewProps {
  resultData: AssessmentResultsData;
  onContinue?: () => void;
}

const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  resultData,
  onContinue,
}) => {
  const [animatekey, setAnimateKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Trigger animation explicitly on mount when passing results
    setAnimateKey(Date.now());
  }, []);

  const habitudes = HABITUDES.map((h) => {
    const key = h.id.toLowerCase() as keyof AssessmentResultsData;
    const habitudeResult = resultData?.[key];
    const score = habitudeResult?.thats_me ?? 0;
    return { ...h, score };
  });

  const totalThatsMe = habitudes.reduce((sum, item) => sum + item.score, 0);

  const habitudesWithPercent = habitudes.map((h) => ({
    ...h,
    percent: totalThatsMe > 0 ? Math.round((h.score / totalThatsMe) * 100) : 0,
  }));

  const sortedHabitudes = [...habitudesWithPercent].sort(
    (a, b) => b.percent - a.percent,
  );
  const activeHabitude =
    selectedIndex !== null
      ? habitudesWithPercent[selectedIndex]
      : sortedHabitudes[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E2EDF8", "#F0F5FA", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: insets.top + verticalScale(10),
            paddingBottom: insets.bottom + verticalScale(20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.heading}>Habitude Results</Text>
          <Text style={styles.subheading}>Your results at a glance</Text>
        </View>

        {/* ── Ring ── */}
        <View style={styles.ringWrapper}>
          <MultiRing
            animatedKey={animatekey}
            size={RING_SIZE}
            strokeWidth={STROKE_WIDTH}
            segments={habitudesWithPercent.map((item) => ({
              value: item.percent,
              color: item.color,
            }))}
            onPressSegment={(index) => setSelectedIndex(index)}
          />
          <View style={styles.centerText} pointerEvents="none">
            <Text
              style={styles.centerLabel}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {activeHabitude?.id?.toUpperCase()}
            </Text>
            <Text
              style={[styles.centerNum, { fontSize: RING_SIZE * 0.25 }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {activeHabitude?.percent ?? 0}%
            </Text>
          </View>
        </View>

        {/* ── List ── */}
        <View style={styles.listWrapper}>
          <View style={styles.card}>
            {sortedHabitudes.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.65}
                  onPress={() =>
                    router.push({
                      pathname: "/HabitudeReport",
                      params: { id: item.id },
                    })
                  }
                >
                  <View
                    style={[styles.colorBox, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.score}>{item.score}</Text>
                  <Text style={styles.percent}>{item.percent}%</Text>
                  <Text style={styles.label}>{item.id}</Text>
                  <View style={{ flex: 1 }} />
                  <Feather
                    name="chevron-right"
                    size={moderateScale(20)}
                    color="#CCCCCC"
                  />
                </TouchableOpacity>
                {index < sortedHabitudes.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Continue Button (Conditional) ── */}
        {onContinue && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.8}
              onPress={onContinue}
            >
              <LinearGradient
                colors={["#1D3E83", "#2C52A5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>
                  Continue to Dashboard
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AssessmentResultView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    alignItems: "center",
    justifyContent: "space-evenly",
    minHeight: "100%",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
  },
  heading: {
    fontSize: moderateScale(34),
    fontWeight: "600",
    color: "#111111",
    letterSpacing: -1,
    marginBottom: verticalScale(2),
  },
  subheading: {
    fontSize: moderateScale(16),
    color: "#7A8A9E",
    fontWeight: "500",
    letterSpacing: -0.2,
  },

  // ── Ring ──────────────────────────────────────────────────────────────────
  ringWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: verticalScale(10),
  },
  centerText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  centerLabel: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#6D839C",
    letterSpacing: 2.5,
    marginBottom: verticalScale(2),
  },
  centerNum: {
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: -2,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listWrapper: {
    width: "100%",
    paddingHorizontal: scale(22),
    alignItems: "stretch",
  },
  card: {
    backgroundColor: "transparent",
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
  },
  colorBox: {
    width: scale(24),
    height: scale(24),
    borderRadius: moderateScale(8),
    marginRight: scale(14),
  },
  score: {
    fontSize: moderateScale(18),
    fontWeight: "500",
    color: "#222222",
    marginRight: scale(10),
    minWidth: scale(18),
  },
  percent: {
    fontSize: moderateScale(15),
    color: "#888888",
    marginRight: scale(12),
    minWidth: scale(36),
    fontWeight: "500",
  },
  label: {
    fontSize: moderateScale(17),
    fontWeight: "600",
    color: "#111111",
  },
  divider: {
    borderWidth: 1,
    borderColor: "#E0E5EC",
    borderStyle: "dashed",
    borderRadius: 1,
  },

  // ── Continue Button ───────────────────────────────────────────────────────
  buttonContainer: {
    width: "100%",
    paddingHorizontal: scale(28),
    marginTop: verticalScale(32),
    alignItems: "center",
  },
  continueButton: {
    width: "100%",
    maxWidth: 320,
  },
  continueButtonGradient: {
    width: "100%",
    paddingVertical: moderateScale(18),
    borderRadius: 30, // Fully rounded for modern mobile apps
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D3E83",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
