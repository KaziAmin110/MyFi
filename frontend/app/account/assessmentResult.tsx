import { Text, View, StyleSheet, ScrollView, Touchable, TouchableOpacity} from "react-native";
import {scale, verticalScale, moderateScale} from "../../utils/scale";
import MultiRing from "../components/MultiRing";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, {useState, useCallback} from 'react';

const habitudes = [
    {
        id: "Spontaneous",
        description: "Money encourages you to enjoy the moment.",
        score: 5, 
        percent: 29,
        color: "#E31422",
        secondaryColor: "#AF0C17"
    },
    {
        id: "Giving",
        description: "Money helps you feel good by giving to others.",
        score: 1, 
        percent: 9,
        color: "#60B334",
        secondaryColor: "#468724"
    },
     {
        id: "Planning",
        description: "Money helps you achieve your goals.",
        score: 1, 
        percent: 14,
        color: "#21428F",
        secondaryColor: "#1C3778"
        
    },
    {
        id: "Carefree",
        description: "Money isn't a priority. You just let life happen.",
        score: 3, 
        percent: 17,
        color: "#FFDE0D",
        secondaryColor: "#D6BA0A"
    },
    {
        id: "Security",
        description: "Money helps you feel safe and in control.",
        score: 4, 
        percent: 22,
        color: "#787878",
        secondaryColor: "#616060"
    },
    {
        id: "Status",
        description: "Money helps you present a positive image.",
        score: 4, 
        percent: 22,
        color: "#9E3C8E",
        secondaryColor: "#6C175E"
    }
    
]

const AssessmentResult = () => {
    const sortedHabitudes = [...habitudes].sort(
    (a, b) => b.percent - a.percent
  );
  const[animatekey, setAnimateKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimateKey(Date.now());
    }, [])
  );
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
             
          
            <Text style={styles.heading}adjustsFontSizeToFit numberOfLines={1}>Habitude Results</Text>
            <Text style={styles.subheading}>Your results at a glance</Text>
          
            <MultiRing
                animatedKey={animatekey}
                segments={habitudes.map((item) => ({
                    value: item.percent,
                    color: item.color,
                }))}
                
            />

            <ScrollView
                style={styles.habitudeSection}
                showsVerticalScrollIndicator={false}
                >
                {sortedHabitudes.map((item, index) => (
                <View key={item.id}>
                    <View style={styles.row}>
                    <View style={styles.left}>
                        <View
                        style={[styles.colorBox, { backgroundColor: item.color }]}
                        />

                        <Text style={styles.score}>{item.score}</Text>
                        <Text style={styles.percent}>{item.percent}%</Text>
                        <Text style={styles.label}>{item.id}</Text>
                    </View>

                    <TouchableOpacity onPress={() => router.push({
                        pathname: '/components/HabitudeReport',
                        params: { 
                            id: item.id ,
                            description: item.description,
                            score: String(item.score),
                            percent: String(item.percent),
                            color: item.color,
                            darkerColor: item.secondaryColor
                        }
                    })}>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>

                    {index !== habitudes.length - 1 && <View style={styles.divider} />}
                </View>
                ))}
            </ScrollView>
      
    </View>
  );
};

export default AssessmentResult;

const styles = StyleSheet.create({
    container:
    {
        flex:1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: verticalScale(30),
    
    },
    heading:
    {
        fontSize: moderateScale(32),
        fontWeight:"600",
        marginBottom: verticalScale(5),
        textAlign: "center",
        width: scale(200),
  
    },
    subheading:
    {
        fontSize: moderateScale(15),
        color: "#484848",
        marginBottom: verticalScale(8),

    },
    gradient:
    {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: verticalScale(200),
        
    },
    habitudeSection:
    {
     
        width: "100%",
        paddingHorizontal: scale(20),
        marginTop: verticalScale(8),

    },
   row: 
   {
    minHeight: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: 
  {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorBox: 
  {
    width: scale(24),
    height: scale(24),
    borderRadius: moderateScale(6),
    marginRight: scale(18),
  },
  score: 
  {
    fontSize: moderateScale(18),
    fontWeight: "500",
    color: "#3B3B3B",
    width: scale(24),
    marginRight: scale(12),
  },
  percent: 
  {
    fontSize: moderateScale(16),
    color: "#B7B7B7",
    width: scale(52),
    marginRight: scale(5),
    
  },
  label: 
  {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#111111",
  },
  arrow: 
  {
    fontSize: moderateScale(30),
    color: "#8F96A3",
    marginLeft: scale(10),
  },
  divider: 
  {
  height: 1,
  backgroundColor: "#D3D3D3",
  marginVertical: verticalScale(8),
  opacity: 0.6,
},
});