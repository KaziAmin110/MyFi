import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponderInstance,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.2; // Slightly reduced from 1.35 to prevent overflow
const CARD_CONTAINER_HEIGHT = CARD_HEIGHT + 60;

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
    outputRange: [0.94, 1],
  });
  const back1TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0], // Compacted from -24
  });
  const back1Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  const back2Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 0.94],
  });
  const back2TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-36, -18], // Compacted from -48
  });
  const back2Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  const back3Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 0.88],
  });
  const back3TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-54, -36], // Compacted from -72
  });
  const back3Opacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backCardTextScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
    extrapolate: "clamp",
  });

  const renderInnerCard = (text: string, opacity?: any) => (
    <View style={styles.innerCard}>
      <LogoBadge style={styles.logoTopLeft} />
      <Animated.View
        style={[
          styles.cardTextContainer,
          opacity && { opacity },
          { transform: [{ scale: backCardTextScale }] },
        ]}
      >
        <Text style={styles.cardText}>{text}</Text>
      </Animated.View>
      <LogoBadge style={styles.logoBottomRight} />
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      {/* 3rd back card */}
      {currentIndex + 3 < totalQuestions && (
        <Animated.View
          style={[
            styles.card,
            styles.cardBack2,
            {
              backgroundColor: back3BorderColor,
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
              backgroundColor: backBorderColor,
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
              backgroundColor: middleBorderColor,
              shadowColor: middleBorderColor,
              opacity: back1Opacity,
              transform: [
                { scale: back1Scale },
                { translateY: back1TranslateY },
              ],
            },
          ]}
        >
          {renderInnerCard(questions[currentIndex + 1]?.text)}
        </Animated.View>
      )}

      {/* Front / active card */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          {
            backgroundColor: frontBorderColor,
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

        {renderInnerCard(questions[currentIndex]?.text)}
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
    paddingTop: 18, // Reduced from 48 for compactness
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    position: "absolute",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    padding: 12, // Reduced from 18 to 12 for a slimmer border look
  },
  innerCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
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
  cardTextContainer: {
    width: "85%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    color: "#1C1C1E",
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  logoTopLeft: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 26,
    height: 26,
    opacity: 0.9,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 26,
    height: 26,
    opacity: 0.9,
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
