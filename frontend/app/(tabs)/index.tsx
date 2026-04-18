import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
} from "react-native";
import {scale, verticalScale, moderateScale, moderateVerticalScale} from "../../utils/scale";



const cards = [
  {
    image: require("../../assets/images/MH_cards.png"),
    title: "Discover What Drives Your Money Decisions",
    subtext: "Your Habits + Attitudes = Your Money Personality",
    imageSz: 200,
    subtextSize: moderateScale(18),
    imageMarginBottom: verticalScale(45),
    subtextMarginTop: verticalScale(15),
    fontWeight: "400",
    slidePadding: moderateVerticalScale(120),
    
  },
  {
    image: require("../../assets/images/chatDisplay.png"),
    title: "Schedule Personalized Chats to",
    subtext: "Explore Your Money Mindset",
    imageSz: 500,
    imageMarginBottom: verticalScale(35),
    subtextSize: moderateScale(22.75),
    fontWeight: "600",
    slidePadding: moderateVerticalScale(150),
  },
  {
    image: require("../../assets/images/resultDisplay.png"),
    title: "Your Habitudes,",
    subtext: "All In One Place",
    imageSz: 600,
    subtextSize: moderateScale(22.75),
    imageMarginBottom: verticalScale(15),
    fontWeight: "600",
    slidePadding: moderateVerticalScale(160),
    
  },
  
];

export default function Index() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width, height} = useWindowDimensions();

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const showCard = ({ item }: any) => {
    
    const imageSize = Math.min(scale(item.imageSz), height * 0.65);

    return (
      <View style={[styles.slide, { width, paddingBottom: item.slidePadding}]}>
        <View
          style={[styles.infoContainer, { marginTop: verticalScale(40) }]}
        >
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
          {cards.indexOf(item) === 1 && (
            <View style={[styles.line, { width: width - scale(48) }]}></View>
          )}
          <Text style={[styles.title, { fontSize: moderateScale(22.75)}]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.subtext,
              {
                fontSize: item.subtextSize,
                marginTop: item.subtextMarginTop,
                fontWeight: item.fontWeight,
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
                {
                  backgroundColor:
                    currentIndex === index ? "#3059AD" : "rgba(48,89,173,0.21)",
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/register")}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnTxt}>Get Started</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Text style={{ fontSize: moderateScale(15) }}>
            Have an account?{" "}
            <Text style={{ color: "#345995", fontWeight: "700"}}>
              Log in
            </Text>
          </Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: 
  {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F0EEEE",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: 
  {
    marginBottom: verticalScale(10),
  },
  line:
  {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C7C2C2",
  },
  title: 
  {
    marginTop: verticalScale(15),
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter",

  },
  subtext: {
    color: "rgb(89,85,85)",
    textAlign: "center",
    marginTop: verticalScale(8),
    fontFamily: "Inter",
  },

  ellipseContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    gap: scale(10),
  },

  ellipse: {
    width: scale(9),
    height: scale(9),
    borderRadius: scale(4),
             
  
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: moderateVerticalScale(25),
    paddingTop: moderateVerticalScale(10),

  },
  primaryBtn: {
    backgroundColor: "#345995",
    marginVertical: verticalScale(10),
    borderRadius: scale(25),
    width: "90%",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    alignItems: "center",
    shadowColor: "#345995",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,             
  },
  primaryBtnTxt: {
    fontSize: moderateScale(17),
    color: "#ffffff",
    fontFamily: "Inter",
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: scale(24),

  },
});
