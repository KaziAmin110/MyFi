import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  scale,
  verticalScale,
  moderateScale,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../../utils/scale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RING_SIZE = Math.min(SCREEN_HEIGHT * 0.28, SCREEN_WIDTH * 0.58);
const SKELETON_COLOR = "#E1E9F4";

const AssessmentResultSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const AnimatedView = Animated.createAnimatedComponent(View);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E2EDF8", "#F0F5FA", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.scrollContainer,
          {
            paddingTop: insets.top + verticalScale(10),
            paddingBottom: insets.bottom + verticalScale(20),
          },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <AnimatedView style={[styles.skeletonText, styles.title, { opacity }]} />
          <AnimatedView style={[styles.skeletonText, styles.subtitle, { opacity }]} />
        </View>

        {/* ── Ring ── */}
        <View style={styles.ringWrapper}>
          <AnimatedView style={[styles.skeletonRing, { opacity }]} />
        </View>

        {/* ── List ── */}
        <View style={styles.listWrapper}>
          <View style={styles.card}>
            {[1, 2, 3, 4, 5, 6].map((item, index) => (
              <View key={item}>
                <View style={styles.row}>
                  <AnimatedView style={[styles.skeletonColorBox, { opacity }]} />
                  <AnimatedView style={[styles.skeletonText, styles.score, { opacity }]} />
                  <AnimatedView style={[styles.skeletonText, styles.percent, { opacity }]} />
                  <AnimatedView style={[styles.skeletonText, styles.label, { opacity }]} />
                  <View style={{ flex: 1 }} />
                  <AnimatedView style={[styles.skeletonChevron, { opacity }]} />
                </View>
                {index < 5 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Button ── */}
        <View style={styles.buttonContainer}>
          <AnimatedView style={[styles.skeletonButton, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

export default AssessmentResultSkeleton;

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
    marginBottom: verticalScale(10),
  },
  skeletonText: {
    backgroundColor: SKELETON_COLOR,
    borderRadius: 8,
  },
  title: {
    width: scale(200),
    height: moderateScale(34),
    marginBottom: verticalScale(8),
  },
  subtitle: {
    width: scale(150),
    height: moderateScale(16),
  },

  // ── Ring ──────────────────────────────────────────────────────────────────
  ringWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: verticalScale(10),
    width: RING_SIZE,
    height: RING_SIZE,
  },
  skeletonRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_SIZE * 0.14,
    borderColor: SKELETON_COLOR,
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
  skeletonColorBox: {
    width: scale(24),
    height: scale(24),
    borderRadius: moderateScale(8),
    marginRight: scale(14),
    backgroundColor: SKELETON_COLOR,
  },
  score: {
    width: scale(20),
    height: moderateScale(18),
    marginRight: scale(10),
  },
  percent: {
    width: scale(36),
    height: moderateScale(15),
    marginRight: scale(12),
  },
  label: {
    width: scale(100),
    height: moderateScale(17),
  },
  skeletonChevron: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: SKELETON_COLOR,
  },
  divider: {
    borderWidth: 1,
    borderColor: "#E0E5EC",
    borderStyle: "dashed",
    borderRadius: 1,
  },

  // ── Button ───────────────────────────────────────────────────────
  buttonContainer: {
    width: "100%",
    paddingHorizontal: scale(28),
    marginTop: verticalScale(32),
    alignItems: "center",
  },
  skeletonButton: {
    width: "100%",
    maxWidth: 320,
    height: moderateScale(54),
    borderRadius: 30,
    backgroundColor: SKELETON_COLOR,
  },
});
