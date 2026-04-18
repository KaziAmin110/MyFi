import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image } from "expo-image";

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
        <View style={styles.backBtn} />
        <Image
          source={require("../../assets/images/Money_Habitudes.svg")}
          style={styles.headerLogo}
          contentFit="contain"
        />
        <View style={styles.backBtn} />
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.topProgressContainer}>
        <View style={styles.questionRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            disabled={!canBack}
          >
            {canBack && <Text style={styles.backArrow}>‹</Text>}
          </TouchableOpacity>

          <Text style={styles.questionCountText}>
            QUESTION {currentIndex + 1} OF {totalQuestions}
          </Text>

          <View style={styles.backBtn} />
        </View>

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
  headerLogo: {
    width: 240,
    height: 42,
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
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  questionCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 1.2,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#7ed957",
    borderRadius: 3,
  },
});

export default AssessmentHeader;
