import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";

interface DashboardHeroProps {
  firstName: string;
  contentWidth: number | `${number}%`;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  firstName,
  contentWidth,
}) => {
  return (
    <View style={[styles.hero, { width: contentWidth as any, alignSelf: "center" }]}>
      <MaskedView maskElement={<Text style={styles.title}>Hey {firstName}!</Text>}>
        <LinearGradient
          colors={["#12BD37", "#3059AD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.title, { opacity: 0 }]}>Hello {firstName}!</Text>
        </LinearGradient>
      </MaskedView>

      <Text style={styles.subtitle}>
        Let{"'"}s <Text style={styles.tackle}>tackle</Text> your financial habits
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(16),
  },
  title: {
    fontSize: moderateScale(34),
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#3D3D3D",
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginTop: moderateVerticalScale(4),
    marginBottom: moderateVerticalScale(2),
    textAlign: "center",
  },
  tackle: {
    color: "#06BE00",
  },
});
