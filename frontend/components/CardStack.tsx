import React from "react";
import { View ,Text, StyleSheet} from "react-native";
import {scale, verticalScale, moderateScale} from "../utils/scale";

const CardStack = ({ count, color, secondaryColor, num }: {
    count: number,
    color: string,
    secondaryColor: string,
    num: number
}) => {

    return(
        
        <View style={styles.wrapper}>
            {count >= 2 && (
                <View style = {[
                    styles.card,
                    {
                        backgroundColor: secondaryColor,
                        position: "absolute",
                        transform: [{ rotate: "-8deg" }],
                        },
                    ]}
                />
            )}
            <View style={[styles.card, {backgroundColor: color}]}> 
                    <Text style={styles.number}>{num}</Text>
            </View>
        </View>

    )

}

export default CardStack;

const styles = StyleSheet.create({
    wrapper: {
        width: scale(90),
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        width: moderateScale(47),
        height: moderateScale(63),
        borderRadius: moderateScale(5),
        alignItems: "center",
        justifyContent: "center",
    },
    number: {
        color: "#FFFFFF",
        fontSize: moderateScale(32),
        fontWeight: "800",
    },
});