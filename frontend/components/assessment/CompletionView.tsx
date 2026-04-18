import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Animated,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CompletionViewProps {
  onFinish: () => void;
  colors: any;
}

const CompletionView: React.FC<CompletionViewProps> = ({
  onFinish,
  colors,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={["#DCE9F2", "#E8F0F7", "#F9FAFC"]}
      style={styles.container}
    >
      <SafeAreaView style={completionStyles.container}>
        <Animated.View
          style={[
            completionStyles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={completionStyles.successCard}>
            {/* Center illustration */}
            <View style={completionStyles.logoContainer}>
              <Image
                source={require("../../assets/images/MH_cards.png")}
                style={completionStyles.centerLogo}
              />
            </View>

            {/* Title */}
            <Text style={completionStyles.title}>Great Job!</Text>
            <Text style={completionStyles.subtitle}>
              You have completed the{"\n"}Money Habitudes Assessment!
            </Text>
          </View>
        </Animated.View>

        {/* View Results button */}
        <View style={completionStyles.buttonContainer}>
          <TouchableOpacity
            style={completionStyles.btnWrapper}
            activeOpacity={0.8}
            onPress={onFinish}
          >
            <LinearGradient
              colors={["#1D3E83", "#2C52A5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={completionStyles.viewResultsBtn}
            >
              <Text style={completionStyles.viewResultsBtnText}>
                View Results
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Confetti cannons */}
        <ConfettiCannon
          count={100}
          origin={{ x: -20, y: SCREEN_HEIGHT - 100 }}
          fadeOut
          autoStart
          fallSpeed={3000}
          explosionSpeed={350}
          colors={["#3B7BF6", "#43A047", "#F5A623", "#E53935", "#8E24AA"]}
        />
        <ConfettiCannon
          count={100}
          origin={{ x: SCREEN_WIDTH + 20, y: SCREEN_HEIGHT - 100 }}
          fadeOut
          autoStart
          fallSpeed={3000}
          explosionSpeed={350}
          colors={["#3B7BF6", "#43A047", "#F5A623", "#E53935", "#8E24AA"]}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const completionStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  successCard: {
    width: "100%",
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    position: "relative",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  centerLogo: {
    width: 130,
    height: 130,
    resizeMode: "contain",
    zIndex: 2,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 19,
    color: "#48484A", // Darker for better premium contrast
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 28,
    paddingBottom: 40,
    alignItems: "center",
  },
  btnWrapper: {
    width: "100%",
    maxWidth: 320,
  },
  viewResultsBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30, // Fully rounded for modern mobile apps
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D3E83",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  viewResultsBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default CompletionView;
