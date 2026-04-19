import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, moderateVerticalScale } from "../../utils/scale";

interface AppointmentReminderProps {
  contentWidth: number | `${number}%`;
  onPress: () => void;
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({
  contentWidth,
  onPress,
}) => {
  return (
    <Pressable
      style={[
        styles.card,
        styles.appointmentDisplay,
        { width: contentWidth as any, alignSelf: "center" },
      ]}
      onPress={onPress}
    >
      <Image
        source={require("../../assets/images/calendarPic.png")}
        style={styles.calPic}
        resizeMode="contain"
      />
      <View style={styles.appointmentText}>
        <Text style={styles.appointmentTitle}>Setup a Reminder</Text>
        <Text
          style={styles.appointmentSubTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Schedule a weekly meeting with your AI Coach
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#AAAAAA" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  appointmentDisplay: {
    paddingVertical: moderateVerticalScale(18),
    paddingHorizontal: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
  },
  calPic: {
    marginRight: moderateScale(14),
    width: moderateScale(40),
    height: moderateScale(40),
  },
  appointmentText: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginBottom: 3,
    color: "#3D3D3D",
  },
  appointmentSubTitle: {
    fontSize: moderateScale(15),
    color: "#6A6A6A",
    lineHeight: moderateScale(18),
  },
});
