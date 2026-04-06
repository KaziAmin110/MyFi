import {View, StyleSheet,} from "react-native";
import {scale, verticalScale, moderateScale} from "../../utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React from 'react';

const ROW_HEIGHT = verticalScale(21);
const SKELETON_COLOR = "#D9D9D9";

const SkeletonBox = ({style}: {style: object}) => (
    <View style={[{ backgroundColor:SKELETON_COLOR}, style]}/>
);

const AssessmentSkeleton = ({}) => {

    return (
        <View style={styles.container}>
             <View style={styles.gradient}>
                <LinearGradient
                    colors={["#BCD1F0", 'rgba(255,255,255,0)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.gradient}
                />
             </View>
             
          
            <SkeletonBox style={styles.heading} />
            <SkeletonBox style={styles.subheading} />
            <SkeletonBox style={styles.ring} />


            <View style={styles.habitudeSection}>
                {[...Array(6)].map((_, index) => (
                <View key={index} style={styles.row}>
                    <SkeletonBox style={styles.colorBox} />
                    <SkeletonBox style={styles.score} />
                    <SkeletonBox style={styles.percent} />
                    <SkeletonBox style={styles.label} />
                </View>
                ))}
            </View>
        </View>
  );
};
export default AssessmentSkeleton;

const styles = StyleSheet.create({
    container: 
    {
      flex: 1,
      alignItems: "center",
      paddingTop: verticalScale(30),
    },
    gradient: 
    {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: verticalScale(550),
    },
    heading: 
    {
      marginTop: verticalScale(45),
      width: scale(200),
      height: verticalScale(34),
      borderRadius: moderateScale(8),
      marginBottom: verticalScale(5),
    },
    subheading: 
    {
      width: scale(160),
      height: verticalScale(11),
      borderRadius: moderateScale(8),
      marginBottom: verticalScale(12),
    },
    ring: 
    {
      width: scale(200),
      height: scale(200),
      borderRadius: scale(130),
      marginBottom: verticalScale(12),
      
    },
    habitudeSection: 
    {
      width: "100%",
      paddingHorizontal: scale(20),
    },
    row: 
    {
      minHeight: ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(10),
      gap: scale(10),
      padding: verticalScale(15),
    },
    colorBox: 
    {
      width: scale(24),
      height: ROW_HEIGHT,
      borderRadius: moderateScale(6),
    },
    score: 
    {
      width: scale(24),
      height: ROW_HEIGHT,
      borderRadius: moderateScale(6),
    },
    percent: 
    {
      width: scale(45),
      height: ROW_HEIGHT,
      borderRadius: moderateScale(6),
    },
    label: 
    {
      width: scale(200),
      height: ROW_HEIGHT,
      borderRadius: moderateScale(6),
    },
  });