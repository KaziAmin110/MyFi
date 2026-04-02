import { Text, View, StyleSheet, Animated, Easing} from "react-native";
import Svg, {Circle, G} from 'react-native-svg';
import React, {useEffect, useRef, useState} from 'react';


type SingleRingProps = {
    size?: number;
    strokeWidth?: number;
    percent: number;
    color: string;
    backgroundColor?: string;
    animatedKey?: number;
}
const SingleRing = ({
  size = 99,
  strokeWidth = 10,
  percent,
  color,
  backgroundColor = "#FFFFFF",
  animatedKey = 0,
}: SingleRingProps) => {
  const clampedPercent = Math.max(0, Math.min(percent, 100));
  const animation = useRef(new Animated.Value(0)).current;
  const [animateProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressLength = (clampedPercent / 100) * circumference * animateProgress;
  const remainingLength = circumference - progressLength;

  

  useEffect(() => {
    animation.setValue(0);
    setAnimatedProgress(0);
    const listenerId = animation.addListener(({ value }) => {
        setAnimatedProgress(value);
    });
    Animated.timing(animation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver:false,
    }).start();
    return () => {
        animation.removeListener(listenerId);
        animation.stopAnimation();
    };
}, [animatedKey, animation]);


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