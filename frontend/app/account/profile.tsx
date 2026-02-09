import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const userName = "William Davis"; // replace later with real user data

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.avatar} />
        </View>

        {/* White card */}
        <View style={styles.card}>
        <Text style={styles.name}>{userName}</Text>

        <ProfileItem
            label="Account Preferences"
            onPress={() => router.push("/account/profile")}
        />

        <ProfileItem
            label="Appointments"
            onPress={() => router.push("/account/profile")}
        />

        <ProfileItem
            label="Sign Out"
            onPress={() => {router.replace("/(tabs)");}} // apply logout logic later
        />
        </View>
    </View>
  );
}

/* Reusable row */
function ProfileItem({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={[styles.itemText, danger && styles.dangerText]}>
        {label}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BCD1F0",
  },

  header: {
    height: 260,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },

  avatar: {
    position: "absolute",
    bottom: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#fff",
  },

  card: {
    marginTop: 80,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  name: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 24,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  itemText: {
    fontSize: 16,
    color: "#404040",
  },

  dangerText: {
    color: "#DC2626",
    fontWeight: "500",
  },

  chevron: {
    fontSize: 22,
    color: "#9CA3AF",
  },
});