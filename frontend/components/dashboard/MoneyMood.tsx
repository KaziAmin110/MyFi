import React, { useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";

interface MoneyMoodProps {
  contentWidth: number | `${number}%`;
}

export const MoneyMood: React.FC<MoneyMoodProps> = ({ contentWidth }) => {
  const sadShake = useRef(new Animated.Value(0)).current;
  const happyShake = useRef(new Animated.Value(0)).current;
  const sadScale = useRef(new Animated.Value(1)).current;
  const happyScale = useRef(new Animated.Value(1)).current;
  const sliderVal = useRef(50);
  const lastZone = useRef<"sad" | "middle" | "happy">("middle");

  const doShake = (rotation: Animated.Value, scale: Animated.Value) => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.75,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -0.5,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleMoodChange = (value: number) => {
    sliderVal.current = value;
    let currentZone: "sad" | "middle" | "happy" = "middle";

    if (value <= 25) currentZone = "sad";
    else if (value >= 75) currentZone = "happy";

    if (currentZone !== lastZone.current) {
      lastZone.current = currentZone;
      if (currentZone === "sad") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        doShake(sadShake, sadScale);
      }
      if (currentZone === "happy") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        doShake(happyShake, happyScale);
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        styles.moneyMood,
        { width: contentWidth as any, alignSelf: "center" },
      ]}
    >
      <Text style={styles.moneyMoodTitle}>What is your money mood today?</Text>
      <View style={styles.sliderRow}>
        <Animated.Image
          source={require("../../assets/images/sad.png")}
          style={[
            styles.moodIcon,
            { marginRight: 8 },
            {
              transform: [
                {
                  rotate: sadShake.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-15deg", "15deg"],
                  }),
                },
                { scale: sadScale },
              ],
            },
          ]}
          resizeMode="contain"
        />
        <View style={styles.sliderContainer}>
          <LinearGradient
            colors={["#BEFFC3", "#06BE00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trackBack}
          />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={sliderVal.current}
            onValueChange={handleMoodChange}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="#059C00"
          />
        </View>
        <Animated.Image
          source={require("../../assets/images/happy.png")}
          style={[
            styles.moodIcon,
            { marginLeft: 8 },
            {
              transform: [
                {
                  rotate: happyShake.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-15deg", "15deg"],
                  }),
                },
                { scale: happyScale },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  moneyMood: {
    paddingVertical: moderateVerticalScale(16),
    paddingHorizontal: moderateScale(20),
  },
  moneyMoodTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#3D3D3D",
    marginBottom: moderateVerticalScale(10),
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderContainer: {
    flex: 1,
    height: 36,
    justifyContent: "center",
  },
  trackBack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 12,
  },
  slider: {
    position: "absolute",
    left: -10,
    right: -10,
  },
  moodIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
  },
});
