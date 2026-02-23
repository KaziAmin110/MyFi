import { useEffect } from "react";
import { Text, View, Image, StyleSheet} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";


export default function Splash()
{
    useEffect(() => {
        const time = setTimeout(() => {
            router.replace("/(tabs)");

        }, 1200);
        return () => clearTimeout(time);
    }, []);

    return(
        <LinearGradient
            colors={["#3059AD", "#60B98F"]}
            locations={[0.39, 0.85]}
            start={{x: 0.5, y: 0}}
            end={{x:0.5 , y:1}}
            style={styles.container}        
        >
             <View style={{flex: 1}}/>
             
            <View style={styles.logoContainer}>
                <View style={styles.brandRow}>
                    <Image
                    source ={require("../assets/images/logo.png")}
                    style={styles.logo}
                    resizeMode="contain">
                    </Image>
                 </View>
            </View>

            <View style={{flex: 1}}/>
           <View style={styles.bottomInfo}>
                <View style={styles.row}> 
                    <Text style={styles.rowText}>powered by Money Habitudes</Text>
                    <Image
                     source ={require("../assets/images/MH_cards.png")}
                     style={styles.cards}
                     resizeMode="contain">
                    </Image>
                </View>
           </View>
        </LinearGradient>

        
    )

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logoContainer:{
        alignItems: "center",
        justifyContent: "center",

    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo:{
        width: 290,
        height: 290,
        marginRight: 12,

    },
    bottomInfo:{
        paddingBottom: 60,
        alignItems: "center",

    },
    row:{
        flexDirection: "row",
        alignItems: "center",
    },
    rowText:{
        fontSize: 15,
        fontWeight: "200",
        color:"#FFFFFF",
    },
    cards:{
        width: 22,
        height: 22,
    },


});
