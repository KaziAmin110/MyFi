import React from "react";
import { View, Text, StyleSheet, Animated, Dimensions, PanResponderInstance } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.15;
const CARD_CONTAINER_HEIGHT = CARD_HEIGHT + 70;

interface Question {
  id: string;
  text: string;
  category?: string;
}

interface QuestionCardStackProps {
  questions: Question[];
  currentIndex: number;
  totalQuestions: number;
  position: Animated.ValueXY;
  dragProgress: Animated.Value;
  panResponder: PanResponderInstance;
  rotate: Animated.AnimatedInterpolation<string | number>;
  isRevisiting: boolean;
  frontBorderColor: string;
  middleBorderColor: string;
  backBorderColor: string;
  back3BorderColor: string;
  LogoBadge: any;
}

const QuestionCardStack: React.FC<QuestionCardStackProps> = ({
  questions,
  currentIndex,
  totalQuestions,
  position,
  dragProgress,
  panResponder,
  rotate,
  isRevisiting,
  frontBorderColor,
  middleBorderColor,
  backBorderColor,
  back3BorderColor,
  LogoBadge,
}) => {
  // Back card animated styles
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
  const back3Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  const backCardTextScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.cardContainer}>
      {/* 3rd back card */}
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

      {/* Middle card */}
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
        {isRevisiting && (
          <View style={styles.revisitBadge}>
            <Text style={styles.revisitBadgeText}>PREVIOUSLY ANSWERED</Text>
          </View>
        )}

        <View style={styles.cardContentWrapper}>
          <LogoBadge style={styles.logoBadgeCenter} />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardText}>{questions[currentIndex]?.text}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: "#1C1C1E",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  logoBadgeCenter: {
    position: "absolute",
    top: 28,
    alignSelf: "center",
    opacity: 0.8,
  },
  revisitBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    backgroundColor: "#3059AD",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 30,
    shadowColor: "#3059AD",
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
});

export default QuestionCardStack;
