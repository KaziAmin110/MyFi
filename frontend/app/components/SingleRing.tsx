import { Text, View, StyleSheet, Animated, Easing} from "react-native";
import Svg, {Circle, G} from 'react-native-svg';
import React, {useEffect, useRef, useState} from 'react';


type SingleRingProps = {
    size?: number;
    strokeWidth?: number;
    percent: number;
    color: string;
    backgroundColor?: string;
}
const SingleRing = ({
  size = 99,
  strokeWidth = 10,
  percent,
  color,
  backgroundColor = "#FFFFFF",
}: SingleRingProps) => {
  const clampedPercent = Math.max(0, Math.min(percent, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressLength = (clampedPercent / 100) * circumference;
  const remainingLength = circumference - progressLength;

  return (
    <View style={styles.wrapper}>
        <Svg width={size} height={size}>
            <G rotation="180" origin={`${size / 2}, ${size / 2}`}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${progressLength} ${remainingLength}`}
                    strokeLinecap="round"
                />
            </G>
        </Svg>
        <View style={styles.percentContainer}>
            <Text style={styles.centerText}>{clampedPercent}%</Text>
        </View>
    </View>

  );
   
};

export default SingleRing;

const styles = StyleSheet.create({

    wrapper:
    {
        justifyContent: "center",
        alignItems: "center",
    },
    percentContainer:
    {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    centerText:
    {
        fontSize: 20,
        fontWeight: "600",
    }
    


});