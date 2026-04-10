import { View, StyleSheet, Animated, Easing, GestureResponderEvent } from "react-native";
import Svg, {Circle, G} from 'react-native-svg';
import React, {useEffect, useRef, useState} from 'react';
import { moderateScale,scale } from "../utils/scale";

const GAP = 3;
type Segment = {
    value: number;
    color: string;
}
type RingProps={
    size?: number;
    strokeWidth?: number;
    segments?: Segment[];
    animatedKey?: number;
    onPressSegment?: (index: number) => void;
};

const Ring = ({
    size = scale(220), 
    strokeWidth = moderateScale(28),
    segments = [] ,
    animatedKey = 0,
    onPressSegment,
}: RingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

   const total = segments.reduce((sum, seg) => sum + seg.value, 0);
   const animation = useRef(new Animated.Value(0)).current;
   const[animatedProgress, setAnimatedProgress] = useState(0);

   useEffect(() => {
    animation.setValue(0);
    setAnimatedProgress(0);
    const listenerId = animation.addListener(({value}) => {
        setAnimatedProgress(value);
    });
    Animated.timing(animation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
    }).start();

     return () => {
    animation.removeListener(listenerId);
    animation.stopAnimation();
  };
}, [animatedKey, animation]);

   let totalPercent = 0;

   const handleTouch = (evt: GestureResponderEvent) => {
       if (!onPressSegment) return;
       const { locationX, locationY } = evt.nativeEvent;
       const dx = locationX - size / 2;
       const dy = locationY - size / 2;
       
       const distance = Math.sqrt(dx * dx + dy * dy);
       // Generous touch target range based on strokeWidth
       const innerRadius = radius - strokeWidth / 2 - 30; 
       const outerRadius = radius + strokeWidth / 2 + 30;
       
       if (distance >= innerRadius && distance <= outerRadius) {
           let angle = Math.atan2(dy, dx);
           if (angle < 0) angle += 2 * Math.PI;
           
           // Rotate angle by 180 degrees (PI radians) because our SVG <G> has rotation="180" 
           // and thus starts drawing from the 9 o'clock position (which is Math.PI)
           let shiftedAngle = angle - Math.PI;
           if (shiftedAngle < 0) shiftedAngle += 2 * Math.PI;
           
           const touchPercent = shiftedAngle / (2 * Math.PI);
           let accumulated = 0;
           for (let i = 0; i < segments.length; i++) {
               const percent = total === 0 ? 0 : segments[i].value / total;
               if (touchPercent >= accumulated && touchPercent <= accumulated + percent) {
                   onPressSegment(i);
                   break;
               }
               accumulated += percent;
           }
       }
   };
    
    return (
        <View 
            style={[styles.container, { width: size, height: size }]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleTouch}
        >
            <Svg width={size} height={size} pointerEvents="none">
                <G rotation="180" origin={`${size / 2}, ${size / 2}`}>
                    <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E3E7EE"
                    strokeWidth={strokeWidth}
                    fill="none"
                    />
                    {segments.map((segment, index) => {
                    const percent = total === 0 ? 0 : segment.value / total;

                    const rawLength = percent * circumference;
                    const adjustedLength = Math.max(rawLength - GAP, 0);
                    const animatedLength = adjustedLength * animatedProgress;
                    const strokeDasharray = `${animatedLength} ${circumference}`;
                    const strokeDashoffset = -totalPercent * circumference;

                    totalPercent += percent;
                    return(
                        <Circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="butt"
                        />
                    );
                })}
            </G>
        </Svg>
    </View>
  );
};
export default Ring;

const styles = StyleSheet.create({
    container:
    {
        justifyContent: "center",
        alignItems: "center",

    },

});