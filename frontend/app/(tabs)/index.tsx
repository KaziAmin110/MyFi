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
import { VideoExportPreset } from "expo-image-picker";


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
    
  },
  {
    image: require("../../assets/images/chatDisplay.png"),
    title: "Schedule Personalized Chats to",
    subtext: "Explore Your Money Mindset",
    imageSz: 500,
    imageMarginBottom: verticalScale(35),
    subtextSize: moderateScale(20),
    fontWeight: "600",
  },
  {
    image: require("../../assets/images/display.png"),
    title: "Your Habitudes,",
    subtext: "All In One Place",
    imageSz: 600,
    subtextSize: moderateScale(25),
    fontWeight: "600",
    imageMarginBottom: verticalScale(25),
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
    
    const imageSize = Math.min(scale(item.imageSz), height * 0.6);

    return (
      <View style={[styles.slide, { width }]}>
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
          <Text style={[styles.title, { fontSize: moderateScale(22.5)}]}>
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
          style={[styles.primaryBtn, { padding: verticalScale(10)}]}
        >
          <Text style={styles.primaryBtnTxt}>Create account</Text>
        </Pressable>

        <Link href="/login">Have an account? Log in</Link>
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
    marginBottom: verticalScale(18),
  },
  line:
  {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C7C2C2",
  },
  title: 
  {
    marginTop: verticalScale(15),
    fontSize: moderateScale(30),
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter",
  },
  subtext: {
    color: "rgb(89,85,85)",
    textAlign: "center",
    marginTop: verticalScale(8),
    maxWidth: scale(380),
    fontFamily: "Inter",
    fontSize: moderateScale(16),
  },

  ellipseContainer: {
    marginTop: verticalScale(15),
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
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(10),
  },
  primaryBtn: {
    backgroundColor: "#345995",
    marginVertical: verticalScale(10),
    borderRadius: scale(45),
    width: "80%",
    alignItems: "center",
  },
  primaryBtnTxt: {
    fontSize: moderateScale(18),
    color: "#ffffff",
    fontFamily: "Inter",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(140),
  },
});
