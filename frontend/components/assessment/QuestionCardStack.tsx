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
  LogoBadge,
}) => {
  // ── Back cards sit ABOVE the front card — peeking out from the top ──
  // Card 1 behind: sits 18px above the front card
  const back1Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const back1TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  // Card 2 behind: sits 36px above
  const back2Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 0.96],
  });
  const back2TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-36, -18],
  });

  // Card 3 behind: barely visible at top
  const back3Scale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 0.92],
  });
  const back3TranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-54, -36],
  });
  const back3Opacity = dragProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.7, 1],
  });

  const renderInnerCard = (text: string) => {
    const isLongText = text.length > 80;
    return (
      <View style={styles.innerCard}>
        <LogoBadge style={styles.logoTopLeft} />
        <Animated.View style={styles.cardTextContainer}>
          <Text
            style={[
              styles.cardText,
              // Left-align long text — center alignment becomes hard to read at 5+ lines
              { textAlign: isLongText ? "left" : "center" },
            ]}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            numberOfLines={10}
          >
            {text}
          </Text>
        </Animated.View>
        <LogoBadge style={styles.logoBottomRight} />
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* 3rd back card — barely peeking */}
      {currentIndex + 3 < totalQuestions && (
        <Animated.View
          style={[
            styles.card,
            styles.cardBack2,
            styles.cardBackTinted3,
            {
              opacity: back3Opacity,
              transform: [
                { scale: back3Scale },
                { translateY: back3TranslateY },
              ],
            },
          ]}
        />
      )}

      {/* 2nd back card */}
      {currentIndex + 2 < totalQuestions && (
        <Animated.View
          style={[
            styles.card,
            styles.cardBack2,
            styles.cardBackTinted2,
            {
              transform: [
                { scale: back2Scale },
                { translateY: back2TranslateY },
              ],
            },
          ]}
        />
      )}

      {/* 1st back card — clearly peeking from the top */}
      {currentIndex + 1 < totalQuestions && (
        <Animated.View
          style={[
            styles.card,
            styles.cardBack1,
            styles.cardBackTinted1,
            {
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
    paddingTop: 18,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    position: "absolute",
    // Removed hard black border — depth conveyed via layered shadows
    borderWidth: 0,
    // Soft, layered shadow for premium physical depth
    shadowColor: "#1A2B4A",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  // Subtle gray tints for the back cards — differentiate from white front
  cardBackTinted1: {
    backgroundColor: "#F0F2F5",
  },
  cardBackTinted2: {
    backgroundColor: "#E5E8ED",
  },
  cardBackTinted3: {
    backgroundColor: "#DADDE3",
  },
  innerCard: {
    flex: 1,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    // Whisper-thin inner border for card definition without harshness
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
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
    width: "78%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 30,
    fontWeight: "600",
    // textAlign is set dynamically in renderInnerCard based on text length
    color: "#1C1C1E",
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  logoTopLeft: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 28,
    height: 28,
    opacity: 0.9,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
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
