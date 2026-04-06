import { Text, View, StyleSheet, ScrollView, TouchableOpacity} from "react-native";
import {scale, verticalScale, moderateScale} from "../../utils/scale";
import MultiRing from "../../components/MultiRing";
import { HABITUDES } from "../../constants/habitudes";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, {useState, useCallback} from 'react';
import AssessmentSkeleton from "./AssessmentSkeleton";
import { AssessmentResultsData, useAssessmentResults } from "@/services/assessmentResult.service";

const AssessmentResult = () => {

 
    const [animatekey, setAnimateKey] = useState(0);
    const {resultData, loading, hasFetched} = useAssessmentResults();


    const habitudes = HABITUDES.map(h => {
        const key = h.id.toLowerCase() as keyof AssessmentResultsData;
        const habitudeResult = resultData?.[key];

        const score = habitudeResult?.thats_me ?? 0;
        const percent = Math.round((score / 54) * 100);
        return { ...h, score, percent };
    });
    
    const totalThatsMe = habitudes.reduce((sum, item) => sum + item.score, 0);
    const sortedHabitudes = [...habitudes].sort((a, b) => b.percent - a.percent);

    useFocusEffect(
        useCallback(() => {
            setAnimateKey(Date.now());

            if (!loading && hasFetched&& !resultData) 
            {
                router.replace("/account/preAssessment");
            }
        }, [loading, hasFetched,resultData])
    );

    if (loading || !hasFetched)
        return <AssessmentSkeleton/>;

    if(!resultData)
    {
        return null;
    }

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

            <View style={styles.topSection}>
                <Text style={styles.heading} adjustsFontSizeToFit numberOfLines={1}>Habitude Results</Text>
                <Text style={styles.subheading}>Your results at a glance</Text>
                <View style={styles.ringView}>
                    <MultiRing
                        animatedKey={animatekey}
                        segments={habitudes.map((item) => ({
                            value: item.percent,
                            color: item.color,
                        }))}
                    />
                    <View style={styles.centerText}>
                        <Text style={styles.totalNum}>{totalThatsMe}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.habitudeSection}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: verticalScale(20) }} 
            >
                {sortedHabitudes.map((item, index) => (
                    <View key={item.id}>
                        <TouchableOpacity 
                            style={styles.row}
                            onPress={() => router.push({
                                pathname: "/account/HabitudeReport",
                                params: {
                                    id: item.id,
                                },
                            })}
                        >
                            <View style={styles.left}>
                                <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                                <Text style={styles.score}>{item.score}</Text>
                                <Text style={styles.percent}>{item.percent}%</Text>
                                <Text style={styles.label}>{item.id}</Text>
                            </View>

                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                        

                        {index !== sortedHabitudes.length - 1 && <View style={styles.divider} />}
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
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(30),
    
    },
    topSection:
    {
        alignItems:"center",
        flexShrink: 1,
        paddingHorizontal: scale(20),
        marginTop: verticalScale(45), 
    },
    heading:
    {
        fontSize: moderateScale(28),
        fontWeight:"600",
        marginBottom: verticalScale(4),
        textAlign: "center",
        width: scale(200),
  
    },
    subheading:
    {
        fontSize: moderateScale(13),
        color: "#484848",
        marginBottom: verticalScale(10),

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
    ringView: 
    {
        justifyContent: "center",
        alignItems:"center",
    },
    centerText:
    {
        position: "absolute",
        justifyContent: "center",
        alignItems:"center",
    },
    totalNum:
    {
        fontSize: moderateScale(55),
        color: "#3D3D3D",
    },
    habitudeSection:
    {
        flex:1,
        width: "100%",
        paddingHorizontal: scale(20),
        marginTop: verticalScale(8),
        marginBottom: verticalScale(10),
        
    },
   row: 
   {
    padding: verticalScale(10),
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
    marginVertical: verticalScale(5),
    opacity: 0.6,
  },
});
