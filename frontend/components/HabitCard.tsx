import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { useRef, useCallback } from "react";
import * as Haptics from "expo-haptics";

type Habit = {
  id: string;
  title: string;
  borderColor: string;
  image: any;
  tagLine: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
};

type HabitCardsProps = {
  onSelect: (habit: Habit) => void;
};

const AnimatedCard = ({ item, onSelect }: { item: Habit; onSelect: (habit: Habit) => void }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.pressable, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(item)}
      >
        <View style={[styles.outerCard, { borderColor: item.borderColor }]}>
          <View style={[styles.innerBorder, { borderColor: item.borderColor }]}>
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const HabitCard = ({ onSelect }: HabitCardsProps) => {
  const cards: Habit[] = [
    {
      id: "giving",
      title: "Giving",
      borderColor: "#60B334",
      image: require("../assets/images/cardImages/giving.png"),
      tagLine: "Money helps your feel good by giving to others.",
      description:
        "Giving is intentionally sharing your money to benefit others, without expecting anything in return. As a habit, it's not about the amount. It's about consistency and intention.",
      advantages: [
        "Have strong values and convictions.",
        "Generously give to other people or causes.",
        "Live simply to reflect non-materalistic values.",
        "Act ethically and with integrity.",
        "Be needed; other depend on you.",
        "Be appeciated for being thoughtful",
      ],
      disadvantages: [
        "Disappointed if money or gifts are not appreciated. ",
        "May have unrealistic expectations that others will repay your generosity. ",
        "Use giving as a form of control to impose your personal values on others. ",
        "Intolerant of people who have different lifestyles. ",
        "Resent when giving is expected and assumed. ",
        "Promote dependence or irresponsible behavior by giving too much or too often. ",
        "Sacrifice your needs or future security for others",
      ],
    },
    {
      id: "planning",
      title: "Planning",
      borderColor: "#21428F",
      image: require("../assets/images/cardImages/planning.png"),
      tagLine: "Money helps you achieve your goals.",
      description:
        "Planning as a money habit is about being intentional with your finances instead of reacting to them. It's one of the strongest habits because it affects every other money decision you make.",
      advantages: [
        "Make intentional financial decisions based on values and desired long-term outcomes",
        "Have money reserved to pay for the unexpected.",
        "Set and accomplish goals.",
        "Buy items you really want that will retain value",
      ],
      disadvantages: [
        "Feel pressured by others to spend money on things that do not fit your budget or values. ",
        "Expected to help others who did not plan. ",
        "Have difficulty responding to new opportunities if it means changing or abandoning your plan. ",
        "Intolerant or impatient when others do not meet your standards or have different values. ",
        "Hide or withhold information from significant others to stay in control of the money. ",
      ],
    },
    {
      id: "security",
      title: "Security",
      borderColor: "#787878",
      image: require("../assets/images/cardImages/security.png"),
      tagLine: "Money helps you feel safe, secure and in control.",
      description:
        "Security is the habit of protecting yourself from financial shocks so money problems don't turn into life problems. It's about stability, safety, and resilience, not wealth or luxury.",
      advantages: [
        "Have a budget, financial goals and savings.",
        "Shop wisely for value items on sale.",
        "Protect money by being conservative",
        "Have more choices later because you've saved today.",
      ],
      disadvantages: [
        "Worry about money even when it is safe. ",
        "Be so cautious that you miss out on good chances. ",
        `Feel like you never have "enough" to be secure.`,
        "Hide or keep secrets about money to protect it. ",
        "Spend too much energy focusing on risks instead of enjoying life. ",
        "Find it hard to relax or trust others with money decisions. ",
      ],
    },
    {
      id: "status",
      title: "Status",
      borderColor: "#9E3C8E",
      image: require("../assets/images/cardImages/status.png"),
      tagLine: "Money helps you present a positive image.",
      description:
        "Status is how we use money to signal identity, success, or belonging to others. It's spending (or saving) driven by how things look, how we compare to others, and how we want to be perceived.",
      advantages: [
        "Present a strong first impression.",
        "Make generous donations.",
        "Give expensive or unexpected gifts.",
        "Be attentive to what is important to others.",
        "Never burden others about money problems.",
      ],
      disadvantages: [
        "Create a false impression of having wealth. ",
        "Feel constant stress to keep up with others. ",
        "Do not have reserves for the unexpected. ",
        "Spend money unwisely to maintain appearances. ",
        "Feel entitled to special treatment. ",
        "Actions motivated by personal gain may be seen as suspicious and insincere; people may feel used. ",
        "Keep money secrets because of the fear of losing friends or status if others knew your real financial situation. ",
      ],
    },
    {
      id: "spontaneous",
      title: "Spontaneous",
      borderColor: "#E31422",
      image: require("../assets/images/cardImages/spot.png"),
      tagLine: "Money encourages you to enjoy the moment",
      description:
        "Spontaneous is the money habit that feels good in the moment and quietly shapes your finances long-term. Being spontaneous with money means making decisions in the moment.",
      advantages: [
        "Enjoy adventures and the unexpected.",
        "Be able to quickly respond to opportunities.",
        "Get a lot of attention and recognition.",
        "Get things right away without waiting.",
      ],
      disadvantages: [
        "Feel pressured by others to spend money on things that do not fit your budget or values. ",
        "Expected to help others who did not plan",
        "Have difficulty responding to new opportunities if it means changing or abandoning your plan. ",
        "Intolerant or impatient when others do not meet your standards or have different values. ",
        "Hide or withhold information from significant others to stay in control of the money. ",
      ],
    },
    {
      id: "carefree",
      title: "Carefree",
      borderColor: "#FFDE0D",
      image: require("../assets/images/cardImages/carefree.png"),
      tagLine: "Money is not a priority. You just let life happen",
      description:
        "Being carefree with money is having a relaxed, confident attitude toward finances. It's not about spending recklessly. It's about not letting money stress dominate your life.",
      advantages: [
        "Be optimistic that everything will work out.",
        "Respond quickly to new opportunities.",
        "Not be distracted by money considerations or details.",
        "Easily share what you have with others.",
      ],
      disadvantages: [
        "Lack the skills and information to feel confident. ",
        "Unable to support yourself if the person(s) providing for you cannot continue or chooses to stop. ",
        "Feel trapped or obligated by being supported. ",
        "Miss opportunities by avoiding commitments or missing deadlines. ",
        "Lose track of money or possessions. ",
        "Frustrated by how often things don't work out as expected. ",
      ],
    },
  ];

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const onViewableItemsChanged = useCallback(({ changed }: any) => {
    if (changed.length > 0 && changed[0].isViewable) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <FlatList
      data={cards}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.row}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <AnimatedCard item={item} onSelect={onSelect} />
      )}
    />
  );
};

export default HabitCard;

const styles = StyleSheet.create({
  row: {
    paddingLeft: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  pressable: {
    marginRight: 12,
  },
  outerCard: {
    width: 140,
    height: 200,
    borderWidth: 3,
    borderRadius: 10,
    padding: 5,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 8,
  },
  cardContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  title: {
    width: "100%",
    fontSize: 14,
    fontWeight: "700",
    color: "#5A5A5A",
    textAlign: "center",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 95,
    width: 95,
  },
});