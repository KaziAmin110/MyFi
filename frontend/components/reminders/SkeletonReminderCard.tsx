import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet } from "react-native";

export const SkeletonReminderCard = () => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View style={[styles.reminderCard, { opacity: animatedValue }]}>
      <View style={styles.cardHeader}>
        <View style={styles.timeInfo}>
          <View style={styles.skeletonTime} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonLine1} />
          <View style={styles.skeletonLine2} />
        </View>

        <View style={styles.skeletonBadge} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.skeletonCancelBtn} />
        <View style={styles.skeletonEditBtn} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  reminderCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInfo: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  skeletonTime: {
    width: 60,
    height: 14,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTitle: {
    width: 180,
    height: 26,
    backgroundColor: "#E8E8E8",
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonLine1: {
    width: "100%",
    height: 16,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLine2: {
    width: "70%",
    height: 16,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 70,
    backgroundColor: "#E8E8E8",
    borderRadius: 10,
  },
  skeletonCancelBtn: {
    width: 90,
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },
  skeletonEditBtn: {
    width: 100,
    height: 40,
    backgroundColor: "#E8E8E8",
    borderRadius: 20,
  },
});
