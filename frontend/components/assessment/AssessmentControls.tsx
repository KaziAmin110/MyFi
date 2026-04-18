import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";

interface AssessmentControlsProps {
  handleButton: (answer: any) => void;
  currentAnswer: string | null;
  leftOpacity: Animated.AnimatedInterpolation<string | number>;
  rightOpacity: Animated.AnimatedInterpolation<string | number>;
  upOpacity: Animated.AnimatedInterpolation<string | number>;
  btnNotMeScale: Animated.AnimatedInterpolation<string | number>;
  btnThatsMeScale: Animated.AnimatedInterpolation<string | number>;
  btnSometimesScale: Animated.AnimatedInterpolation<string | number>;
  colors: any;
}

const AssessmentControls: React.FC<AssessmentControlsProps> = ({
  handleButton,
  currentAnswer,
  leftOpacity,
  rightOpacity,
  upOpacity,
  btnNotMeScale,
  btnThatsMeScale,
  btnSometimesScale,
  colors,
}) => {
  return (
    <View style={styles.buttonsSection}>
      {/* Not Me */}
      <TouchableOpacity
        onPress={() => handleButton("not_me")}
        activeOpacity={0.8}
        style={styles.actionItem}
      >
        <Animated.View
          style={[
            styles.actionBtn,
            {
              transform: [{ scale: btnNotMeScale }],
              backgroundColor:
                currentAnswer === "not_me"
                  ? colors.red
                  : leftOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#FFFFFF", colors.red],
                    }),
            },
          ]}
        >
          <Animated.Image
            source={require("../../assets/images/X_Mark_Red.png")}
            style={[
              styles.btnImg,
              {
                opacity:
                  currentAnswer === "not_me"
                    ? 0
                    : Animated.subtract(1, leftOpacity),
              },
            ]}
          />
          <Animated.Image
            source={require("../../assets/images/X_Mark_White.png")}
            style={[
              styles.btnImg,
              styles.btnImgOverlay,
              {
                opacity: currentAnswer === "not_me" ? 1 : leftOpacity,
              },
            ]}
          />
        </Animated.View>
        <Text style={[styles.btnLabel, { color: colors.red }]}>NOT ME</Text>
      </TouchableOpacity>

      {/* Sometimes */}
      <TouchableOpacity
        onPress={() => handleButton("sometimes")}
        activeOpacity={0.8}
        style={[styles.actionItem, { marginTop: 12 }]}
      >
        <Animated.View
          style={[
            styles.actionBtn,
            {
              transform: [{ scale: btnSometimesScale }],
              backgroundColor:
                currentAnswer === "sometimes"
                  ? colors.yellow
                  : upOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#FFFFFF", colors.yellow],
                    }),
            },
          ]}
        >
          <Animated.Image
            source={require("../../assets/images/Qeustion_Mark_Yellow.png")}
            style={[
              styles.btnImg,
              {
                opacity:
                  currentAnswer === "sometimes"
                    ? 0
                    : Animated.subtract(1, upOpacity),
              },
            ]}
          />
          <Animated.Image
            source={require("../../assets/images/Question_Mark_White.png")}
            style={[
              styles.btnImg,
              styles.btnImgOverlay,
              {
                opacity: currentAnswer === "sometimes" ? 1 : upOpacity,
              },
            ]}
          />
        </Animated.View>
        <Text style={[styles.btnLabel, { color: colors.yellow }]}>
          SOMETIMES
        </Text>
      </TouchableOpacity>

      {/* That's Me */}
      <TouchableOpacity
        onPress={() => handleButton("thats_me")}
        activeOpacity={0.8}
        style={styles.actionItem}
      >
        <Animated.View
          style={[
            styles.actionBtn,
            {
              transform: [{ scale: btnThatsMeScale }],
              backgroundColor:
                currentAnswer === "thats_me"
                  ? colors.green
                  : rightOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#FFFFFF", colors.green],
                    }),
            },
          ]}
        >
          <Animated.Image
            source={require("../../assets/images/Check_Mark_Green.png")}
            style={[
              styles.btnImg,
              {
                opacity:
                  currentAnswer === "thats_me"
                    ? 0
                    : Animated.subtract(1, rightOpacity),
              },
            ]}
          />
          <Animated.Image
            source={require("../../assets/images/Check_Mark_White.png")}
            style={[
              styles.btnImg,
              styles.btnImgOverlay,
              {
                opacity: currentAnswer === "thats_me" ? 1 : rightOpacity,
              },
            ]}
          />
        </Animated.View>
        <Text style={[styles.btnLabel, { color: colors.green }]}>
          THAT&apos;S ME
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonsSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    gap: 32,
  },
  actionItem: {
    alignItems: "center",
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  btnImg: { width: 34, height: 34, resizeMode: "contain" },
  btnImgOverlay: { position: "absolute" },
  btnLabel: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

export default AssessmentControls;
