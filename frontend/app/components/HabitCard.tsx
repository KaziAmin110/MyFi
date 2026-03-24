import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
} from "react-native";

type Habit = {
  id: string;
  title: string;
  borderColor: string;
  image: any;
  tagLine: string;
  description: string;
  advantages: string[];
};

type HabitCardsProps = {
  onSelect: (habit: Habit) => void;
};
const HabitCard = ({ onSelect }: HabitCardsProps) => {
  const cards: Habit[] = [
    {
      id: "giving",
      title: "Giving",
      borderColor: "#60B334",
      image: require("../../assets/images/cardImages/giving.png"),
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
    },
    {
      id: "planning",
      title: "Planning",
      borderColor: "#21428F",
      image: require("../../assets/images/cardImages/planning.png"),
      tagLine: "Money helps you achieve your goals.",
      description:
        "Planning as a money habit is about being intentional with your finances instead of reacting to them. It's one of the strongest habits because it affects every other money decision you make.",
      advantages: [
        "Make intentional financial decisions based on values and desired long-term outcomes",
        "Have money reserved to pay for the unexpected.",
        "Set and accomplish goals.",
        "Buy items you really want that will retain value",
      ],
    },
    {
      id: "security",
      title: "Security",
      borderColor: "#787878",
      image: require("../../assets/images/cardImages/security.png"),
      tagLine: "Money helps you feel safe, secure and in control.",
      description:
        "Security is the habit of protecting yourself from financial shocks so money problems don’t turn into life problems.It’s about stability, safety, and resilience, not wealth or luxury.",
      advantages: [
        "Have a budget, financial goals and savings.",
        "Shop wisely for value items on sale.",
        "Protect money by being conservative",
        "Have more choices later because you've saved today.",
      ],
    },
    {
      id: "status",
      title: "Status",
      borderColor: "#9E3C8E",
      image: require("../../assets/images/cardImages/status.png"),
      tagLine: "Money helps you present a positive image.",
      description:
        "Status is how we use money to signal identity, success, or belonging to others.It’s spending (or saving) driven by how things look, how we compare to others, and how we want to be perceived.",
      advantages: [
        "Present a strong first impression.",
        "Make generous donations.",
        "Give expensive or unexpected gifts.",
        "Be attentive to what is important to others.",
        "Never burden others about money problems.",
      ],
    },
    {
      id: "spontaneous",
      title: "Spontaneous",
      borderColor: "#E31422",
      image: require("../../assets/images/cardImages/spot.png"),
      tagLine: "Money encourages you to enjoy the moment",
      description:
        "Spontaneous is the money habit that feels good in the moment and quietly shapes your finances long-term. Being spontaneous with money means making decisions in the moment.",
      advantages: [
        "Enjoy adventures and the unexpected.",
        "Be able to quickly respond to opportunities.",
        "Get a lot of attention and recognition.",
        "Get things right away without waiting.",
      ],
    },
    {
      id: "carefree",
      title: "Carefree",
      borderColor: "#FFDE0D",
      image: require("../../assets/images/cardImages/carefree.png"),
      tagLine: "Money is not a priority. You just let life happen",
      description:
        "Being carefree with money is having a relaxed, confident attitude toward finances. It’s not about spending recklessly. It’s about not letting money stress dominate your life.",
      advantages: [
        "Be optimistic that everything will work out.",
        "Respond quickly to new opportunities.",
        "Not be distracted by money considerations or details.",
        "Easily share what you have with others.",
      ],
    },
  ];

  return (
    <FlatList
      data={cards}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)} style={styles.pressable}>
          <View style={[styles.outerCard, { borderColor: item.borderColor }]}>
            <View
              style={[styles.innerBorder, { borderColor: item.borderColor }]}
            >
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
    marginRight: 0,
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
