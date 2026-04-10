import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import {
  scale,
  verticalScale,
  moderateScale,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../../utils/scale";
import MultiRing from "../../components/MultiRing";
import { HABITUDES } from "../../constants/habitudes";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import AssessmentSkeleton from "./AssessmentSkeleton";
import {
  AssessmentResultsData,
  useAssessmentResults,
} from "@/services/assessmentResult.service";

// Ring takes up screen real estate proportionally to both height and width ensuring consistency across screen sizes
const RING_SIZE = Math.min(SCREEN_HEIGHT * 0.28, SCREEN_WIDTH * 0.6);
const STROKE_WIDTH = RING_SIZE * 0.14; // proportional stroke

const AssessmentResult = () => {
  const [animatekey, setAnimateKey] = useState(0);
  const { resultData, loading, hasFetched } = useAssessmentResults();

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
  const topPercent = sortedHabitudes[0]?.percent ?? 0;

  useFocusEffect(
    useCallback(() => {
      setAnimateKey(Date.now());
      if (!loading && hasFetched && !resultData) {
        router.replace("/account/preAssessment");
      }
    }, [loading, hasFetched, resultData]),
  );

  if (loading || !hasFetched) return <AssessmentSkeleton />;
  if (!resultData) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#C5D8EE", "#D8E6F3", "#E8EFF7"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header (fixed, compact) ── */}
      <View style={styles.header}>
        <Text style={styles.heading}>Habitude Results</Text>
        <Text style={styles.subheading}>Your results at a glance</Text>
      </View>

      {/* ── Ring (flex shrinkable) ── */}
      <View style={styles.ringWrapper}>
        <MultiRing
          animatedKey={animatekey}
          size={RING_SIZE}
          strokeWidth={STROKE_WIDTH}
          segments={habitudesWithPercent.map((item) => ({
            value: item.percent,
            color: item.color,
          }))}
        />
        <View style={styles.centerText}>
          <Text
            style={[styles.centerNum, { fontSize: RING_SIZE * 0.24 }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {topPercent}%
          </Text>
        </View>
      </View>

      {/* ── List — takes all remaining space, vertically centered ── */}
      <View style={styles.listWrapper}>
        <View style={styles.listInner}>
          {sortedHabitudes.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.65}
                onPress={() =>
                  router.push({
                    pathname: "/account/HabitudeReport",
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
    </View>
  );
};

export default AssessmentResult;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly", // Distributes empty space between components instead of bunching them up
    paddingVertical: SCREEN_HEIGHT * 0.04, // Prevents pushing to the absolute top/bottom edges
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
    // margin removed since space-evenly will handle vertical distribution
  },
  heading: {
    fontSize: moderateScale(32),
    fontWeight: "600", // removed bold
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
  },
  centerText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  // fontSize set inline as proportion of RING_SIZE
  centerNum: {
    fontWeight: "500", // removed bold
    color: "#111111",
    letterSpacing: -1,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listWrapper: {
    width: "100%",
    paddingHorizontal: scale(22),
    alignItems: "stretch",
  },
  listInner: {
    // This View wraps all rows — sized to content, centered by listWrapper
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    // Expanded vertical padding for better touch targets and utilizing space
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
});
