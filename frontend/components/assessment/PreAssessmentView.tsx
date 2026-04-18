import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PreAssessmentViewProps {
  onStart: () => void;
}

const PreAssessmentView: React.FC<PreAssessmentViewProps> = ({ onStart }) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  // Scaling thresholds
  const isSmallScreen = SCREEN_HEIGHT < 750;
  const isMediumScreen = SCREEN_HEIGHT < 850;

  return (
    <LinearGradient
      colors={["#DCE9F2", "#E8F0F7", "#F9FAFC"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                isMediumScreen && { width: 110, height: 110, marginBottom: 12 },
                isSmallScreen && { width: 90, height: 90, marginBottom: 8 },
              ]}
            >
              <Image
                source={require("../../assets/images/MH_cards.png")}
                style={styles.logo}
              />
            </View>
            <Text
              style={[
                styles.mainTitle,
                isMediumScreen && { fontSize: 32 },
                isSmallScreen && { fontSize: 28, marginBottom: 4 },
              ]}
            >
              Welcome to MyFi!
            </Text>
            <Text
              style={[
                styles.mainSubtitle,
                isMediumScreen && { fontSize: 16, lineHeight: 22 },
                isSmallScreen && { fontSize: 14, lineHeight: 18 },
              ]}
            >
              Let&apos;s start by understanding your Money Behaviors
            </Text>
          </View>

          <View
            style={[
              styles.cardsContainer,
              isMediumScreen && { marginVertical: 20, gap: 10 },
              isSmallScreen && { marginVertical: 12, gap: 8 },
            ]}
          >
            {/* Card 1: Be Honest */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    isMediumScreen && { fontSize: 20 },
                    isSmallScreen && { fontSize: 18 },
                  ]}
                >
                  Be Honest
                </Text>
              </View>
              <Text
                style={[
                  styles.cardDescription,
                  isMediumScreen && { fontSize: 14, lineHeight: 18 },
                  isSmallScreen && { fontSize: 13, lineHeight: 16 },
                ]}
              >
                There are no right or wrong answers. Answer based on your true
                thoughts and beliefs.
              </Text>
            </View>

            {/* Card 2: Take Your Time */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    isMediumScreen && { fontSize: 20 },
                    isSmallScreen && { fontSize: 18 },
                  ]}
                >
                  Take Your Time
                </Text>
              </View>
              <Text
                style={[
                  styles.cardDescription,
                  isMediumScreen && { fontSize: 14, lineHeight: 18 },
                  isSmallScreen && { fontSize: 13, lineHeight: 16 },
                ]}
              >
                Don&apos;t rush through the questions. But also go with your
                instinct.
              </Text>
            </View>

            {/* Card 3: Be Realistic */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    isMediumScreen && { fontSize: 20 },
                    isSmallScreen && { fontSize: 18 },
                  ]}
                >
                  Be Realistic
                </Text>
              </View>
              <Text
                style={[
                  styles.cardDescription,
                  isMediumScreen && { fontSize: 14, lineHeight: 18 },
                  isSmallScreen && { fontSize: 13, lineHeight: 16 },
                ]}
              >
                The assessment works if you answer truly how you think, not
                how you think you should.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onStart}
              activeOpacity={0.8}
              style={styles.btnWrapper}
            >
              <LinearGradient
                colors={["#1D3E83", "#2C52A5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.primaryBtn,
                  isMediumScreen && { paddingVertical: 14 },
                  isSmallScreen && { paddingVertical: 12 },
                ]}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    isSmallScreen && { fontSize: 16 },
                  ]}
                >
                  Take Assessment
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  header: {
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    width: 130,
    height: 130,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -1,
  },
  mainSubtitle: {
    fontSize: 16,
    color: "#4B4B4B",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  cardsContainer: {
    width: "100%",
    gap: 16, // Slightly increased for visibility of shadows
    marginVertical: 24,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24, // Consistent padding
    // Shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    // Shadow for Android
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#3A3A3C",
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  btnWrapper: {
    width: "100%",
    maxWidth: 280,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default PreAssessmentView;
