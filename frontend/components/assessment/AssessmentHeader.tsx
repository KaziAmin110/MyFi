import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";

interface AssessmentHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  progressPercent: number;
  onBack: () => void;
  canBack: boolean;
  colors: any;
}

const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  currentIndex,
  totalQuestions,
  progressPercent,
  onBack,
  canBack,
  colors,
}) => {
  return (
    <View style={styles.headerWrapper}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          disabled={!canBack}
        >
          {canBack && <Text style={styles.backArrow}>‹</Text>}
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
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: "100%",
    alignItems: "center",
  },
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
    color: "#1C1C1E",
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
    color: "#1C1C1E",
    fontWeight: "300",
    marginTop: -2,
  },
  topProgressContainer: {
    width: "100%",
    paddingHorizontal: 32,
    marginBottom: 8,
    alignItems: "center",
  },
  questionCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
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
    backgroundColor: "#3059AD",
    borderRadius: 3,
  },
});

export default AssessmentHeader;
