import { useLocalSearchParams, Stack, router } from "expo-router";
import { View ,Text, StyleSheet, ScrollView, TouchableOpacity, Image} from "react-native";
import React, {useState} from "react";
import SingleRing from "../components/SingleRing";
import CardStack from "../components/CardStack";
import {scale, verticalScale, moderateScale} from "../../utils/scale";

const HabitudeReport = () => {
    const { id, description, score, percent, color, darkerColor } = useLocalSearchParams();
    const parsedScore = Number(Array.isArray(score) ? score[0] : score);
    const parsedPercent = Number(Array.isArray(percent) ? percent[0] : percent);
    const parsedColor = Array.isArray(color) ? color[0] : color;
    const parsedDarkColor = Array.isArray(darkerColor) ? darkerColor[0] : darkerColor;
    const [expanded, setExpanded] = useState(false);

    const advantages = 
    [
        "Make intentional financial decisions based on values and desired long-term outcomes.",
        "Have money reserved to pay for the unexpected.",
        "Set and accomplish goals.",
        "Buy items you really want that will retain value.",
        "Have a sense of well-being and control.",
    ];
    const disadvantages = 
    [
        "Feel pressured by others to spend money on things that do not fit your budget or values.",
        "Expected to help others who did not plan",
        "Have difficulty responding to new opportunities if it means changing orabandoning your plan.",
        "Intolerant or impatient when others do not meet your standards or have different values.",
        "Hide or withhold information from significant others to stay in control of the money."
    ];
    
    return (
        <>
        <Stack.Screen options={{ headerShown: false }} />    
        <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        >

            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Image
                    source={require("../../assets/images/resultDisplay/backArrow.png")} 
                    style={styles.backArrow}
                    resizeMode="contain"
                />
                </TouchableOpacity>
                <Text style={styles.heading}>{id}</Text>
                <View style={styles.backArrow} />
            </View> 

            <Text style={styles.description}>{description}</Text>
            <View style={styles.ringRow}>
                <SingleRing
                    percent={parsedPercent}
                    color={parsedColor}
                />
                <View style={styles.forYou}>
                    <Text style={styles.forYouText}>
                        For you, Spontaneous is a dominant Habitude. That means your first
                        thought when you get money will be to use it to let you enjoy the 
                    moment.</Text>
                </View>
            </View>

    
            <View style={styles.cardStackWrapper}>
                <Text style={styles.cardHeader}>Your Personal Combination</Text>
                <View style={styles.cardStackRow}>
                    <View style={styles.cardColumn}>
                        <Text style={[styles.cardLabel, {color:parsedColor}]}>NOT ME</Text>
                        <CardStack count={1} color={parsedColor} secondaryColor={parsedDarkColor} num={1} />
                    </View>
                    <View style={styles.cardColumn}>
                        <Text style={[styles.cardLabel, {color:parsedColor}]}>SOMETIMES</Text>
                        <CardStack count={2} color={parsedColor} secondaryColor={parsedDarkColor} num={3} />
                    </View>
                    <View style={styles.cardColumn}>
                        <Text style={[styles.cardLabel, {color:parsedColor}]}>THAT'S ME</Text>
                        <CardStack count={2} color={parsedColor} secondaryColor={parsedDarkColor} num={parsedScore} />
                    </View>
                </View>
            </View>

            <View style={styles.yourHabitsInfo}>
                <Text style={styles.habitsHeader}>Your Habits and Attitudes</Text>
                <Text style={styles.cardBody} numberOfLines={expanded ? undefined : 4}>
                    Typically, when you have money, your first thought is about how it could be used to reach your goals or
                    accomplish something you've been planning. That may mean:
                    Putting it toward saving for a house, car, or future event.
                    Paying a bill.
                    Giving it to a person or organization you plan to help.
                    Investing in yourself.
                    Making a financial investment.
                    Whatever you choose to do with money, it fits into a plan.
                    It may be formal like a financial plan, a budget, or written goals.
                    It may also be informal and something you've thought about but haven't written down.
                </Text>
                <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expand}>
                    <Image
                        source={require("../../assets/images/resultDisplay/expandBtn.png")}
                        style={[styles.expand, { transform: [{ rotate: expanded ? "180deg" : "0deg" }] }]}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>


            <View style={styles.yourHabitsInfo}>
                <Text style={styles.infoHeader}>Advantages</Text>
                <View style={styles.bulletContainer}>
                    {advantages.map((item, index) => (
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
                        {disadvantages.map((item, index) => (
                            <View key={index} style={styles.bulletRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
            </View>
                
    
        </ScrollView>
        </>
    )
}
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
    cardHeader: {
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
    habitsHeader: {
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
    infoHeader: {
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




})