import { Text, View, StyleSheet, Image, Modal, Pressable, ScrollView} from "react-native";
import {useState, useEffect} from 'react';
import Slider from "@react-native-community/slider";
import * as SecureStore from "expo-secure-store";
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient'
import HabitCard from "../components/HabitCard";

const dashboard = () => {
    const [mood, setMood] = useState(60);
    const[firstName, setFirstName] = useState('');
    const dayLabel=["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekDates = weekInfo(new Date());

    const[selectedHabit, setSelectedHabit] = useState<any>(null);
    const[habitOpen, setHabitOpen] = useState(false);

    const openHabit = (habit: any) => {
        setSelectedHabit(habit);
        setHabitOpen(true);
    }
    const closeHabit = () => {
        setHabitOpen(false);
        setSelectedHabit(null);
    }


    useEffect(() => {
        const getUser = async() => {
            const stored = await SecureStore.getItemAsync("user");
            if(stored)
            {
                const user = JSON.parse(stored);
                setFirstName(user.name.split(' ')[0]|| 'User');
            }
        };
        getUser();
    }, [] );



    return (
        <LinearGradient
                    colors={['#D5E6FF', '#F5F5F5']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.4 }}
                    style={styles.background}
                >
        <View style={styles.container}>
            <MaskedView maskElement={<Text style={styles.title}>Hello {firstName}!</Text>}>
                <LinearGradient
                    colors={['#12BD37', '#3059AD']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={[styles.title, { opacity: 0 }]}>Hello {firstName}!</Text>
                </LinearGradient>
            </MaskedView>

            
            <Text style={styles.subtitle}>Let's <Text style={styles.tackle}>tackle</Text> your financial habits</Text>
           


        {/* Calendar*/}
            <View style={styles.calendar}>
                <View style={styles.week}>
                    {weekDates.map((day,i) => {
                        const today = isToday(day);
                        return(
                            <View key ={day.toISOString()} style={styles.day}>
                                <Text style={[styles.dayLabel,
                                    today ? styles.todayLabel : styles.normalLabel
                                ]}>{dayLabel[i]}</Text>
                                <View style={[styles.dateBubble, today && styles.todayBubble]}>
                                    <Text style={[styles.date, today ? styles.todayDate : styles.normalDate]}>
                                    {day.getDate()}
                                    </Text>
                                    {/* hasAppointment*/}
                                </View>
                            </View>
                        );
                    })}
                    
                </View>
            </View>

        {/* Money Mood Slider*/}
            <View style={styles.moneyMood}>
                <Text style={styles.moneyMoodTitle}>What is your money mood today?</Text>
                
                <View style={styles.sliderRow}>
                <Image 
                    source={require('../../assets/images/sad.png')} 
                    style={[styles.moodIcon, { marginRight: 8}]}
                    resizeMode="contain"
                />
                <View style={styles.sliderContainer}>
                        <LinearGradient
                        colors={['#BEFFC3', '#06BE00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.trackBack}
                        />
                    <Slider 
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        value={mood}
                        onValueChange={setMood}
                        minimumTrackTintColor="transparent"
                        maximumTrackTintColor="transparent"
                        thumbTintColor="#059C00"
                        >
                    </Slider>
                </View>
                <Image 
                    source={require('../../assets/images/happy.png')} 
                    style={[styles.moodIcon, { marginLeft: 8}]}
                    resizeMode="contain"
                />
                </View>
            </View>

        {/* Set up an appointment*/}
            <View style={styles.appointmentDisplay}>
                <Image 
                        source={require('../../assets/images/calendarPic.png')} 
                        style={styles.calPic}
                        resizeMode="contain"
                    />
                <View style={styles.appointmentText}>
                    <Text style={styles.appointmentTitle}>Set up an appointment</Text>
                    <Text style={styles.appointmentSubTitle}>Schedule a weekly meeting with your AI Coach</Text>
                </View>
                {/*When pressed go to appointment screen*/}
            </View>


{/*Habitude Card info*/}
            <View style={styles.cardsDisplay}>
                <Text style={styles.cardTitle}>Learn about money habits</Text>
                <Text style={styles.cardSubtTitle}>Press any card for more infomation</Text>
                <HabitCard onSelect={openHabit}/>
            </View>
             {/*Partial View*/}
             <Modal
        visible={habitOpen}
        transparent
        animationType="fade"
        onRequestClose={closeHabit}
      >
        {/* dark backdrop */}
        <Pressable style={styles.backdrop} onPress={closeHabit} />

        {/* the card */}
        <View style={styles.modalCenter}>
          <View
            style={[
              styles.habitModal,
              { borderColor: selectedHabit?.borderColor || "#000" },
            ]}
          >
            <View
              style={[
                styles.habitModalInner,
                { borderColor: selectedHabit?.borderColor || "#000" },
              ]}
            >
              {/* header row */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
                <Pressable onPress={closeHabit}>
                  <Text style={styles.closeX}>×</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Image source={selectedHabit?.image} style={styles.modalIcon} resizeMode="contain" />

                <Text style={styles.tagLine}>{selectedHabit?.tagLine}</Text>

                <Text style={styles.paragraph}>{selectedHabit?.description}</Text>

                <Text style={styles.sectionTitle}>Advantages</Text>
                {selectedHabit?.advantages?.map((a: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{a}</Text>
                  </View>
                ))}

                <Pressable style={styles.cta}>
                  <Text style={styles.ctaText}>Ask AI Coach</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>


        {/* Bottom Navigation*/}
        </View>
        </LinearGradient>
    )
}
export default dashboard

const getStart = (date: Date) => {
    const obj = new Date(date);
    obj.setHours(0, 0, 0, 0,);
    const day = obj.getDay();

    obj.setDate(obj.getDate() - day);
    return obj;
};
const weekInfo = (anchor: Date) => {
    const start = getStart(anchor);
    return Array.from({ length: 7}, (_, i) =>{
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });
};
const isToday = (date: Date) =>{
    const today = new Date();
    return(
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};
    
const styles = StyleSheet.create({
    background:
    {
        flex: 1,
        width: '100%',
    },
    container:
    {
        alignItems:"center",
    },
    
    title:
    {
        paddingTop: 110,
        fontSize: 45,
        fontWeight: "600",
    },
    subtitle:
    {
        paddingTop: 9,
        color: "#3D3D3D",
        fontSize: 15,
        fontWeight: "600",
    },
    tackle:
    {
        color: "#06BE00",
    },
    calendar:
    {
        padding: 25,
    },
    week:
    {
        flexDirection: "row",
        width: "100%",
    },
    day:
    {
        flex: 1,
        alignItems:"center",

    },
    dayLabel:
    {
        marginBottom: 15 
    },
    todayLabel:
    {
        color: "#000000",
        fontWeight: "700",
    },
    normalLabel:
    {
        color: "#5D5D5D",
    },
    todayBubble:
    {
        backgroundColor: "#06BE00",
    },
    todayDate:
    {
       color:"#FFFFFF"
    },
    normalDate:
    {
        color: "#000000",
    },
    dateBubble:
    {
        width: 40,
        height: 40,    
        borderRadius: 20,
        backgroundColor:"#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    date:
    {
        fontWeight: "600",
    },
    moneyMood:
    {
        backgroundColor: "#FFFFFF",
        borderRadius: 20, 
        width: "90%",
        paddingVertical: 20,
        paddingHorizontal: 35,
        marginBottom: 35,
        
    },
    moneyMoodTitle:
    {
        fontSize: 15, 
        fontWeight: "600",
        color: "#3D3D3D",
    },
    sliderRow:
    {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sliderContainer:
    {
        flex: 1,
        height: 40,
        justifyContent:'center',
    },
   
   trackBack:
   {
        position:'absolute',
        left:0,
        right:0,
        height: 27,
        borderRadius: 10,
   },
   
    slider: 
    {
        position: 'absolute',
        left: -10,
        right: -10,
        
        
    },
    moodIcon:
    {
        width: 30,
        height: 30,
    },
   
    appointmentDisplay:
    {
        backgroundColor: "#FFFFFF",
        borderRadius: 20, 
        width: "90%",
        paddingVertical: 30,
        paddingHorizontal: 35,
        marginBottom: 35,
        flexDirection:'row',
        alignItems:'center',
    },
    calPic:
    {
        marginRight: 12,
    },
    appointmentText:
    {
        flexDirection: 'column',
    },
    appointmentTitle:
    {
        fontSize: 18, 
        fontWeight: "600",
       marginBottom: 5, 
    },
    appointmentSubTitle:
    {
        fontSize: 15, 
        color: '#3D3D3D',
        
    },
    cardsDisplay:
    {
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        width: "100%", 

    },
    cardTitle:
    {
        fontSize: 16, 
        fontWeight: "600",
        padding: 8,
        
    
    },
    cardSubtTitle:
    {
        fontSize: 12,
        color: '#3D3D3D',
    },
    backdrop:
    {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.55)",
    },

    modalCenter:
    {
        flex: 1,
        justifyContent:"center",
        alignItems:"center",
        paddingHorizontal: 16,
    },
    habitModal:
    {
        width: "90%",
        borderWidth: 4, 
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        padding: 12,
    },
    
    habitModalInner: 
    {
        borderWidth: 3,          
        borderRadius: 22,
        padding: 14,
    },
      
    modalHeader: 
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingTop: 4,
        
    },
      
    modalTitle: 
    {
        fontSize: 30,
        fontWeight: "700",
        color: "#6A6A6A",
        
    },
      
      closeX: 
    {
        fontSize: 34,
        lineHeight: 34,
        color: "#6A6A6A",
    },
      
    modalBody: 
    {
        paddingHorizontal: 8,
        paddingBottom: 14,
    },
      
      modalIcon: 
      {
        width: 110,
        height: 110,
        alignSelf: "center",
        marginTop: 12,
    },
      
    tagLine: 
    {
        textAlign: "center",
        fontSize: 18,
        color: "#6A6A6A",
        marginTop: 12,
        marginBottom: 12,
    },
      
    paragraph: 
    {
        fontSize: 16,
        lineHeight: 24,
        color: "#222",
        marginBottom: 18,
    },
      
    sectionTitle: 
    {
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 10,
    },
      
    bulletRow: 
    {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
      
    bullet: 
    {
        width: 18,
        fontSize: 18,
        lineHeight: 22,
    },
      
    bulletText: 
    {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
    },
      
    cta: 
    {
        marginTop: 18,
        alignSelf: "center",
        backgroundColor: "#3A7DFF",
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 999,
    },
      
    ctaText: 
    {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },

    
})