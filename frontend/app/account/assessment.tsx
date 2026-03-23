import { Text, View, StyleSheet, TouchableOpacity,Image} from "react-native";
import {scale, verticalScale, moderateScale} from "../../utils/scale";
import React from 'react'
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";




const assessment = () => {
    return (

            <LinearGradient 
                colors={['#FFFFFF', 'rgba(188, 209, 240, 0.4)']}
                locations={[0.5, 1]} 
                style={styles.container}
            >
                <Image 
                source={require('../../assets/images/resultDisplay/topGradient.png')}
                style={styles.topGradient}
                resizeMode="stretch"
                />
           
            <View style={styles.content}>
                <Text style={styles.heading}>Habitudes Assessment</Text>
                <Text style={styles.subheading}>Take the habitudes assessment now!</Text>

                <View style={styles.btns}>
                    <TouchableOpacity style={styles.assessmentBtn}>
                            <Text style={styles.assessmentBtnText}>Take the assessment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.resultBtn}
                        onPress={() => router.push('/account/assessmentResult')}
                    
                    >
                        <Text style={styles.resultBtnText}>View assessment score</Text>
                    </TouchableOpacity>
                </View>
            </View>
                </LinearGradient>
 
        
    )
}
export default assessment

const styles = StyleSheet.create({
    container: 
    {
        flex: 1,
      
    },
    
    content: 
    {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    heading:
    {
        fontSize: moderateScale(32),
        fontWeight:"600",
        marginBottom: verticalScale(9),
        textAlign: "center",
        width: scale(200),
  
    },
    subheading:
    {
        fontSize: moderateScale(18),
        fontWeight:"500",
        color: "#5D5D5D",
        marginBottom: verticalScale(35),
    },
    btns:
    {
        alignSelf: "stretch",
        marginHorizontal: scale(80),
        gap: verticalScale(15),
    
    },
    assessmentBtn:
    {
        alignSelf: "stretch",
        backgroundColor: "#21428F",
        paddingVertical: verticalScale(6),
        borderRadius: moderateScale(15),
        alignItems: "center", 
        
    },
    assessmentBtnText: 
    {
        fontSize: moderateScale(16),
        fontWeight: "600",
        color: "#FFFFFF",
      
    },
    resultBtn: 
    {   
        alignSelf: "stretch",
        backgroundColor: "#FFFFFF",
        paddingVertical: verticalScale(6),
        borderRadius: moderateScale(15),
        alignItems: "center",
       

    },
    resultBtnText: 
    {
        fontSize: moderateScale(16),
        fontWeight: "600",
        color: "#21428F",
    },
    
   
    topGradient:
    {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: verticalScale(200),
        
    },
    



})