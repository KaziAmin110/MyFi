import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
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

const RING_SIZE = Math.min(SCREEN_HEIGHT * 0.28, SCREEN_WIDTH * 0.6);
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
        colors={["#C5D8EE", "#D8E6F3", "#E8EFF7"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
              style={[styles.centerNum, { fontSize: RING_SIZE * 0.24 }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {activeHabitude?.percent ?? 0}%
            </Text>
          </View>
        </View>

        {/* ── List ── */}
        <View style={styles.listWrapper}>
          <View style={styles.listInner}>
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
                  <Text style={styles.arrow}>›</Text>
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
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
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
    paddingVertical: SCREEN_HEIGHT * 0.04,
    alignItems: "center",
    justifyContent: "space-evenly",
    minHeight: "100%",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
  },
  heading: {
    fontSize: moderateScale(32),
    fontWeight: "600",
    color: "#111111",
    letterSpacing: -0.5,
    marginBottom: verticalScale(4),
  },
  subheading: {
    fontSize: moderateScale(17),
    color: "#666666",
    fontWeight: "500",
  },

  // ── Ring ──────────────────────────────────────────────────────────────────
  ringWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: verticalScale(20),
  },
  centerText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  centerLabel: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#5A738E",
    letterSpacing: 2,
    marginBottom: verticalScale(-2),
  },
  centerNum: {
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -1.5,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listWrapper: {
    width: "100%",
    paddingHorizontal: scale(22),
    alignItems: "stretch",
  },
  listInner: {
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SCREEN_HEIGHT * 0.016,
  },
  colorBox: {
    width: scale(22),
    height: scale(22),
    borderRadius: moderateScale(6),
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
  arrow: {
    fontSize: moderateScale(24),
    color: "#BBBBBB",
    lineHeight: moderateScale(26),
  },
  divider: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C8C8C8",
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
