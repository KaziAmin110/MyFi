import { Link, router } from "expo-router";
import {useState} from "react";
import { Text, View, Button, Image, StyleSheet, Pressable, Dimensions, FlatList} from "react-native";


const { width, height } = Dimensions.get('window');

 const cards = [
    {
      image: require("../../assets/images/brain.png"),
      title: "Discover What Drives Your Money Decisions",
      subtext: 'Your Habits + Attitudes = Your Money Personality',
      imageSz: 200,
      imageMarginBottom: 95,
      subtextSize: 18,
      subtextMarginTop: 15,
      fontWeight: "400",
      marginBottom: 80,
    },
    {
      image: require("../../assets/images/resultDisplay.png"),
      title: "Your Habitudes,",
      subtext: "All In One Place",
      imageSz: 350,
      subtextSize: 30,
      subtextMarginTop: 0,
      fontWeight: "700",
      marginBottom: 40,
    },
    { 
      image: require("../../assets/images/botChat3.png"),
      title: "Schedule Personalized Chats to",
      subtext: "Explore Your Money Mindset",
      imageSz: 650,
      imageMarginBottom: -155,
      subtextSize: 30,
      fontWeight: "700",
    }
  ];

export default function Index() {

  const [currentIndex, setCurrentIndex] = useState(0);  

 

  const handleScroll = (event : any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width ));
    setCurrentIndex(index);
  };

  const showCard = ({ item }: any ) => {
    const imageSize = item.imageSz * (width / 375); 

    return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.infoContainer}>
        <Image
        source={item.image}
        style={[
          styles.cardImage,
          {
            width: imageSize,
            height: imageSize,
            marginBottom: item.imageMarginBottom,
          },
        ]}
        resizeMode="contain"
      />
      <Text style={styles.title}>{item.title}</Text>
       <Text
          style={[
            styles.subtext,
            { fontSize: item.subtextSize,
              marginTop: item.subtextMarginTop,
              fontWeight: item.fontWeight
            },
          ]}
        >
          {item.subtext}
      </Text>

      </View>
    </View>
    );
  };

  return (
    <View style={styles.container}>
        <FlatList
          data={cards}
          renderItem={showCard}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
        />

      <View style={styles.footer}>
        <View style={styles.ellipseContainer}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.ellipse,
                { backgroundColor: currentIndex === index ? '#3059AD' : "rgba(48,89,173,0.21)",}
              ]} 
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/register")}
          style={styles.primaryBtn}
        >
          <Text style ={styles.primaryBtnTxt}>Create account</Text>
        </Pressable>
        
        <Link href="/login">Have an account? Log in</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F0EEEE',
    
    
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 90,
  },
  cardImage: {
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: 'center',
    fontFamily: 'Inter',

  },
   subtext: {
    color:'rgb(89,85,85)',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: "400",

    
  },

  ellipseContainer: {
    
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },

  ellipse:{
    width: 9,
    height: 9,
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: 45,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  primaryBtn:{
    backgroundColor: '#345995',
    padding: 10,
    marginVertical:10,
    borderRadius: 45,
    width: '80%',
    alignItems: 'center',
    
  },
  primaryBtnTxt:
  {
    fontSize:18,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  slide: {
    width,
    flex:1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
});
