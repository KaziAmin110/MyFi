import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CompletionViewProps {
  onFinish: () => void;
  colors: any;
}

const CompletionView: React.FC<CompletionViewProps> = ({ onFinish, colors }) => {
  return (
    <SafeAreaView style={[styles.container, completionStyles.container]}>
      <View style={completionStyles.content}>
        <View style={completionStyles.successCard}>
          {/* Center illustration */}
          <View style={completionStyles.logoContainer}>
            <View style={completionStyles.glowHalo} />
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
      </View>

      {/* View Results button */}
      <View style={completionStyles.buttonContainer}>
        <TouchableOpacity
          style={completionStyles.viewResultsBtn}
          activeOpacity={0.85}
          onPress={onFinish}
        >
          <Text style={completionStyles.viewResultsBtnText}>View Results</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
});

const completionStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFC",
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
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  glowHalo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3B7BF6",
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  centerLogo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    zIndex: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  viewResultsBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#3059AD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  viewResultsBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default CompletionView;
