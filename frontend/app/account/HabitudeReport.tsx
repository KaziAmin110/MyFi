import { useLocalSearchParams, router } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import SingleRing from "../../components/SingleRing";
import CardStack from "../../components/CardStack";
import { scale, verticalScale, moderateScale } from "../../utils/scale";
import { HABITUDES, getScoreTier } from "../../constants/habitudes";

const HabitudeReport = () => {
    const { id, score, percent, color, darkerColor, notMe, sometimesMe } = useLocalSearchParams();
    const parsedScore = Number(Array.isArray(score) ? score[0] : score);
    const parsedPercent = Number(Array.isArray(percent) ? percent[0] : percent);
    const parsedColor = Array.isArray(color) ? color[0] : color;
    const parsedDarkColor = Array.isArray(darkerColor) ? darkerColor[0] : darkerColor;
    const parsedNotMe = Number(Array.isArray(notMe) ? notMe[0] : notMe);
    const parsedSometimesMe = Number(Array.isArray(sometimesMe) ? sometimesMe[0] : sometimesMe);
    const [expanded, setExpanded] = useState(false);

    const parsedId = Array.isArray(id) ? id[0] : id;
    const habitude = HABITUDES.find(h => h.id === parsedId);
    const tier = getScoreTier(parsedScore);
    const content = habitude?.scoreContent[tier];

    if (!habitude || !content) return null;

    return (
        <>
        <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.replace("/account/assessment")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Image
                        source={require("../../assets/images/resultDisplay/backArrow.png")} 
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
                    percent={parsedPercent}
                    color={parsedColor}
                />
                <View style={styles.forYou}>
                    <Text style={styles.forYouText}>{content.forYou}</Text>
                </View>
            </View>

            <View style={styles.cardStackWrapper}>
                <Text style={styles.cardHeader}>Your Personal Combination</Text>
                <View style={styles.cardStackRow}>
                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: parsedColor }]}>THAT{"'"}S ME</Text>
                    <CardStack
                    count={parsedScore}
                    color={parsedColor}
                    secondaryColor={parsedDarkColor}
                    num={parsedScore}
                    />
                </View>

                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: parsedColor }]}>SOMETIMES</Text>
                    <CardStack
                    count={parsedSometimesMe}
                    color={parsedColor}
                    secondaryColor={parsedDarkColor}
                    num={parsedSometimesMe}
                    />
                </View>

                <View style={styles.cardColumn}>
                    <Text style={[styles.cardLabel, { color: parsedColor }]}>NOT ME</Text>
                    <CardStack
                    count={parsedNotMe}
                    color={parsedColor}
                    secondaryColor={parsedDarkColor}
                    num={parsedNotMe}
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
                            source={require("../../assets/images/resultDisplay/expandBtn.png")}
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

export default HabitudeReport;

const styles = StyleSheet.create({
    container: 
    {
        alignItems: "center",
        backgroundColor: "#F0EEEE",
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
    },
    forYou:
    {
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(20),
        paddingVertical: 25,
        paddingHorizontal: 20,
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
        marginTop: verticalScale(10),
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(20),
        padding: scale(20),
        alignItems: "center",
        marginBottom: verticalScale(10),
    },
    cardHeader: 
    {
        fontSize: moderateScale(15),
        fontWeight: "600",
        marginBottom: verticalScale(10),
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
        padding: verticalScale(12),
        marginBottom: verticalScale(10),
        width: "100%",
    },
    habitsHeader: 
    {
        fontSize: moderateScale(15),
        fontWeight: "600",
        marginBottom: verticalScale(5),
        textAlign:"center"
    },
    cardBody: 
    {
        fontSize: moderateScale(13),
        color: "#3D3D3D",
        lineHeight: moderateScale(22),
    },
    expand:
    {
        alignItems: "center",
        marginTop: verticalScale(5),
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
