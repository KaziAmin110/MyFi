import { Text, View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { scale, verticalScale, moderateScale, SCREEN_HEIGHT } from "../../utils/scale";
import MultiRing from "../../components/MultiRing";
import { HABITUDES } from "../../constants/habitudes";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import AssessmentSkeleton from "./AssessmentSkeleton";
import { AssessmentResultsData, useAssessmentResults } from "@/services/assessmentResult.service";

// Ring is 22% of screen height — shrinks on small devices, grows on large
const RING_SIZE    = SCREEN_HEIGHT * 0.22;
const STROKE_WIDTH = RING_SIZE * 0.14;   // proportional stroke

const AssessmentResult = () => {
    const [animatekey, setAnimateKey] = useState(0);
    const { resultData, loading, hasFetched } = useAssessmentResults();

    const habitudes = HABITUDES.map((h) => {
        const key = h.id.toLowerCase() as keyof AssessmentResultsData;
        const habitudeResult = resultData?.[key];
        const score = habitudeResult?.thats_me ?? 0;
        return { ...h, score };
    });

    const totalThatsMe = habitudes.reduce((sum, item) => sum + item.score, 0);

    const habitudesWithPercent = habitudes.map((h) => ({
        ...h,
        percent: totalThatsMe > 0 ? Math.round((h.score / totalThatsMe) * 100) : 0,
    }));

    const sortedHabitudes = [...habitudesWithPercent].sort((a, b) => b.percent - a.percent);
    const topPercent = sortedHabitudes[0]?.percent ?? 0;

    useFocusEffect(
        useCallback(() => {
            setAnimateKey(Date.now());
            if (!loading && hasFetched && !resultData) {
                router.replace("/account/preAssessment");
            }
        }, [loading, hasFetched, resultData])
    );

    if (loading || !hasFetched) return <AssessmentSkeleton />;
    if (!resultData) return null;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#C5D8EE", "#D8E6F3", "#E8EFF7"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* ── Header (fixed, compact) ── */}
            <View style={styles.header}>
                <Text style={styles.heading}>Habitude Results</Text>
                <Text style={styles.subheading}>Your results at a glance</Text>
            </View>

            {/* ── Ring (flex shrinkable) ── */}
            <View style={styles.ringWrapper}>
                <MultiRing
                    animatedKey={animatekey}
                    size={RING_SIZE}
                    strokeWidth={STROKE_WIDTH}
                    segments={habitudesWithPercent.map((item) => ({
                        value: item.percent,
                        color: item.color,
                    }))}
                />
                <View style={styles.centerText}>
                    <Text
                        style={[styles.centerNum, { fontSize: RING_SIZE * 0.24 }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        {topPercent}%
                    </Text>
                </View>
            </View>

            {/* ── List — takes all remaining space, never scrolls ── */}
            <View style={styles.listWrapper}>
                <FlatList
                    data={sortedHabitudes}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={styles.divider} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            activeOpacity={0.65}
                            onPress={() =>
                                router.push({
                                    pathname: "/account/HabitudeReport",
                                    params: { id: item.id },
                                })
                            }
                        >
                            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                            <Text style={styles.score}>{item.score}</Text>
                            <Text style={styles.percent}>{item.percent}%</Text>
                            <Text style={styles.label}>{item.id}</Text>
                            <View style={{ flex: 1 }} />
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
};

export default AssessmentResult;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        alignItems: "center",
        // Use a fraction of screen height so it stays proportional
        marginTop: SCREEN_HEIGHT * 0.055,
        marginBottom: SCREEN_HEIGHT * 0.005,
    },
    heading: {
        fontSize: moderateScale(24),
        fontWeight: "700",
        color: "#111111",
        letterSpacing: -0.3,
        marginBottom: verticalScale(2),
    },
    subheading: {
        fontSize: moderateScale(12),
        color: "#666666",
        fontWeight: "400",
    },

    // ── Ring ──────────────────────────────────────────────────────────────────
    ringWrapper: {
        justifyContent: "center",
        alignItems: "center",
        // Vertical breathing room proportional to screen
        marginVertical: SCREEN_HEIGHT * 0.012,
    },
    centerText: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    // fontSize set inline as proportion of RING_SIZE
    centerNum: {
        fontWeight: "700",
        color: "#111111",
        letterSpacing: -1,
    },

    // ── List ──────────────────────────────────────────────────────────────────
    listWrapper: {
        flex: 1,          // fill whatever space remains after ring + header
        width: "100%",
        paddingHorizontal: scale(22),
        justifyContent: "center",  // vertically center the rows in remaining space
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        // Vertical padding derived from screen height — shrinks on small devices
        paddingVertical: SCREEN_HEIGHT * 0.013,
    },
    colorBox: {
        width: scale(20),
        height: scale(20),
        borderRadius: moderateScale(5),
        marginRight: scale(12),
    },
    score: {
        fontSize: moderateScale(16),
        fontWeight: "600",
        color: "#222222",
        marginRight: scale(8),
        minWidth: scale(16),
    },
    percent: {
        fontSize: moderateScale(14),
        color: "#AAAAAA",
        marginRight: scale(12),
        minWidth: scale(36),
        fontWeight: "400",
    },
    label: {
        fontSize: moderateScale(15),
        fontWeight: "600",
        color: "#111111",
    },
    arrow: {
        fontSize: moderateScale(24),
        color: "#BBBBBB",
        lineHeight: moderateScale(26),
    },
    divider: {
        height: 1,
        borderTopWidth: 1,
        borderStyle: "dashed",
        borderColor: "#C8C8C8",
    },
});
