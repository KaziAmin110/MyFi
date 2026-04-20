import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState, useCallback } from "react";
import SingleRing from "../components/SingleRing";
import CardStack from "../components/CardStack";
import { scale, verticalScale, moderateScale } from "../utils/scale";
import { HABITUDES, getScoreTier } from "../constants/habitudes";
import { useAssessmentResults, AssessmentResultsData } from "../services/assessmentResult.service";
import AssessmentSkeleton from "./account/AssessmentSkeleton";


const HabitudeReport = () => {
    const { id} = useLocalSearchParams();
    const parsedID =
        typeof id === "string"
            ? id
            : Array.isArray(id)
            ? id[0]
            : "";

    
    const { resultData, loading, hasFetched, loadAssessmentResults } = useAssessmentResults();
    const [expanded, setExpanded] = useState(false);
    const [ringAnimation, setRingAnimation] = useState(0);

    const habitude = HABITUDES.find((h) => h.id === parsedID);

    const key = parsedID?.toLowerCase() as keyof AssessmentResultsData;
    const habitudeResult = resultData?.[key];

    const score = habitudeResult?.thats_me ?? 0;
    const sometimesMe = habitudeResult?.sometimes_me ?? 0;
    const notMe = habitudeResult?.not_me ?? 0;

    const QUESTIONS_PER_SECTION = 9;
    const percent = Math.round((score / QUESTIONS_PER_SECTION) * 100);
    const tier = getScoreTier(score);
    const content = habitude?.scoreContent[tier];
  
    useFocusEffect(
        useCallback(() => {
            setRingAnimation(Date.now());
            if (!hasFetched && !loading) {
                loadAssessmentResults();
            } else if(!loading && hasFetched && !resultData) {
                router.replace("/account/preAssessment");
            }
        }, [loading, hasFetched, resultData, loadAssessmentResults])
    );

    if(!parsedID)
        return null;

    if (loading || !hasFetched)
    {
        return <AssessmentSkeleton/>;
    }

    if(!habitude || !content || !resultData)
        return null;


    return (
        <>
        <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Image
                        source={require("../assets/images/resultDisplay/backArrow.png")} 
                        style={styles.backArrow}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.heading}>{habitude.id}</Text>
                <View style={styles.backArrow} />
            </View> 

            <Text style={styles.description}>{habitude.description}</Text>

            <View style={styles.ringRow}>
                <SingleRing
                    percent={percent}
                    color={habitude.color}
                    animatedKey={ringAnimation}
                />
                <View style={styles.forYou}>
                    <Text style={styles.forYouText}>{content.forYou}</Text>
                </View>
            </View>

            <View style={styles.cardStackWrapper}>
                <Text style={styles.cardHeader}>Your Personal Combination</Text>
                <View style={styles.cardStackRow}>
                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: habitude.color }]}>THAT{"'"}S ME</Text>
                    <CardStack
                    count={score}
                    color={habitude.color}
                    secondaryColor={habitude.secondaryColor}
                    num={score}
                    />
                </View>

                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: habitude.color }]}>SOMETIMES</Text>
                    <CardStack
                    count={sometimesMe}
                    color={habitude.color}
                    secondaryColor={habitude.secondaryColor}
                    num={sometimesMe}
                    />
                </View>

                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: habitude.color }]}>NOT ME</Text>
                    <CardStack
                    count={notMe}
                    color={habitude.color}
                    secondaryColor={habitude.secondaryColor}
                    num={notMe}
                    />
                </View>
                </View>
            </View>


            {content.cardBody ? (
                <View style={styles.yourHabitsInfo}>
                    <Text style={styles.habitsHeader}>Your Habits and Attitudes</Text>
                    <Text style={styles.cardBody} numberOfLines={expanded ? undefined : 4}>
                        {content.cardBody}
                    </Text>
                    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expand}>
                        <Image
                            source={require("../assets/images/resultDisplay/expandBtn.png")}
                            style={[styles.expand, { transform: [{ rotate: expanded ? "180deg" : "0deg" }] }]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            ) : null}

            <View style={styles.yourHabitsInfo}>
                <Text style={styles.infoHeader}>Advantages</Text>
                <View style={styles.bulletContainer}>
                    {habitude.advantages.map((item, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.yourHabitsInfo}>
                <Text style={styles.infoHeader}>Disadvantages</Text>
                <View style={styles.bulletContainer}>
                    {habitude.disadvantages.map((item, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

        </ScrollView>
        </>
    );
};
const CARD_PADDING = scale(20);
export default HabitudeReport;

const styles = StyleSheet.create({
    container: 
    {
        alignItems: "center",
        backgroundColor: "#F0EEEE",
        marginTop: verticalScale(15),
        paddingHorizontal: scale(24),
        paddingBottom: verticalScale(20),
    },
    headerContainer:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent:"space-between",
        width: "100%",
        marginTop: verticalScale(35),
    },
    backArrow: 
    {
        width: scale(10),
        alignItems:"center",
        justifyContent:"center",
    },
    backButton: 
    {
        padding:scale(10),
        marginLeft: scale(-10),
    },
    heading:
    {
        fontSize: moderateScale(20),
        fontWeight: "600",
    },
    description:
    {
        fontSize: moderateScale(12),
        textAlign: "center",
        marginTop: verticalScale(5),
    },
    ringRow: 
    {
        justifyContent:"center",
        width: "100%",
        marginTop: verticalScale(20),
        flexDirection: "row",
        gap: 16,  
        marginBottom: verticalScale(25),
    },
    forYou:
    {
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(20),
        padding: CARD_PADDING,
        flex:1,
    },
    forYouText:
    {
        fontSize: moderateScale(13),
        color: "#3D3D3D",
        lineHeight: moderateScale(22),
        fontWeight: "500",
    },
    cardStackWrapper: 
    {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(20),
        padding: CARD_PADDING,
        alignItems: "center",
        marginBottom: verticalScale(25),
    },
    cardHeader: 
    {
        fontSize: moderateScale(15),
        fontWeight: "600",
        margin: verticalScale(8),
        textAlign:"center"
    },
    cardLabel:
    {
        fontWeight: "800",
        marginBottom: verticalScale(5),
        fontSize: moderateScale(10), 
    },
    cardStackRow: 
    {
        marginTop: verticalScale(8),
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    cardColumn:
    {
        alignItems:"center",
    
    },
    yourHabitsInfo:
    {
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(20),
        padding: CARD_PADDING,
        marginBottom: verticalScale(25),
        width: "100%",
    },
    habitsHeader: 
    {
        fontSize: moderateScale(15),
        fontWeight: "600",
        margin: verticalScale(8),
        color: "#202020",
        textAlign:"center"
    },
    cardBody: 
    {
        fontSize: moderateScale(13),
        color: "#3D3D3D",
        lineHeight: moderateScale(22),
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    expand:
    {
        width: scale(20),
        height: scale(20),
        alignSelf: "center",
        
    },
    infoHeader: 
    {
        fontSize: moderateScale(15),
        fontWeight: "600",
        textAlign:"center"
    },
    bulletContainer: 
    {
        marginTop: verticalScale(4),
        paddingRight: scale(9),
        paddingVertical: 0,
    },
    bulletRow: 
    {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: verticalScale(3),
        
    },
    bullet: 
    {
        fontSize: moderateScale(14),
        marginRight: scale(8),
        lineHeight: moderateScale(22),
    },
    bulletText: 
    {
        fontSize: moderateScale(13),
        color: "#3D3D3D",
        lineHeight: moderateScale(22),
    },
});
