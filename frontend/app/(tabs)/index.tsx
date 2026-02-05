import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View, Button, Image, StyleSheet, Pressable, Dimensions, FlatList, useWindowDimensions} from "react-native";

 const cards = [
    {
      image: require("../../assets/images/MH_cards.png"),
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
      image: require("../../assets/images/display2.png"),
      title: "Your Habitudes,",
      subtext: "All In One Place",
      imageSz: 400,
      imageMarginBottom: 15,
      subtextSize: 30,
      subtextMarginTop: 0,
      fontWeight: "600",
      marginBottom: 40,
    },
    { 
      image: require("../../assets/images/chatBot.png"),
      title: "Schedule Personalized Chats to",
      subtext: "Explore Your Money Mindset",
      imageSz: 500,
      imageMarginBottom: 85,
      subtextSize: 30,
      fontWeight: "600",
    }
  ];

export default function Index() {

  const [currentIndex, setCurrentIndex] = useState(0);  
  const { width, height } = useWindowDimensions();

  //const FootHeight = Math.max(170, Math.round(height * 0));

  const handleScroll = (event : any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width ));
    setCurrentIndex(index);
  };

  const showCard = ({ item }: any ) => {
    //const imageSize = item.imageSz * (width / 375); 
    const scaleW = width / 375;
    const scaledByWidth = item.imageSz * scaleW;
    const maxHeight = height < 700 ? 0.65 : 0.62;
    const imageSize = Math.min(scaledByWidth, height * maxHeight);
    //const cappedByHeight = Math.min(scaledByWidth, height * 0.62);
    //const imageSize = Math.max(180, cappedByHeight);

    return (
    <View style={[styles.slide, { width}]}>
      <View style={[styles.infoContainer, { marginTop: height < 700 ? 10 : 40 }]}>
        <Image
        source={item.image}
        style={[
          styles.cardImage,
          {
            width: imageSize,
            height: imageSize,
            marginBottom: item.imageMarginBottom * (height < 700 ? 0.35 : 0.3),
          },
        ]}
        resizeMode="contain"
      />
      <Text style={[styles.title, { fontSize: height < 700 ? 20 : 30 }]}>{item.title}</Text>
       <Text
          style={[
            styles.subtext,
            {fontSize: height < 700 ? item.subtextSize * 0.65 : item.subtextSize,
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
          style={[styles.primaryBtn, { padding: height < 700 ? 6 : 10 }]}
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

  },
  cardImage: {
    marginBottom: 18,
    //backgroundColor:'black',
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    textAlign: 'center',
    fontFamily: 'Inter',
    
    //backgroundColor:'yellow',

  },
   subtext: {
    color:'rgb(89,85,85)',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 380,
    fontFamily: 'Inter',
    fontSize: 16,
    //fontWeight: "200",
    //backgroundColor:'blue',
    
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
    paddingBottom: 30,
    paddingTop: 10,
    //backgroundColor:'red'
  },
  primaryBtn:{
    backgroundColor: '#345995',
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
    flex:1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
});
