import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export const API_URL = "http://localhost:5500/api/auth";

export const signOut = async () => {
  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(`${API_URL}/auth/sign-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
};

const handleLogout = async () => {
  try {
    // Invalidate refresh token
    await signOut();

  } catch (error) {
    console.log("Backend logout failed:", error);
  }

  // Clear local token
  await SecureStore.deleteItemAsync("token");

  // Redirect to landing/login
  router.replace("/(tabs)");
};

const Profile = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
      const getUser = async () => {
        const stored = await SecureStore.getItemAsync("user");
        if (stored) {
          const user = JSON.parse(stored);
          setFirstName(user.name.split(" ")[0] || "User");
          setLastName(user.name.split(" ")[1] || "User");
        }
      };
      getUser();
    }, []);

    // Define the username
    const userName = {firstName} + " " + {lastName};

  return (
    <View style={styles.container}>
      {/* Page title and avatar */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>

      {/* Avatar placeholder */}
      <View style={styles.avatar} />
    </View>

    <View style={styles.card}>
      {/* Gradient username */}
      <GradientText text={userName} />

      {/* Account Actions */}
      <ProfileItem
        label="Update Profile"
        onPress={() => router.push("/account/profile")}
      />

      <ProfileItem
        label="Change Password"
        onPress={() => router.push("/account/profile")}
      />

      <ProfileItem
        label="Log Out"
        onPress={handleLogout}
      />
    </View>
  </View>
  );
}


function GradientText({ text }: { text: string }) {
  return (
    <MaskedView maskElement={<Text style={styles.name}>{text}</Text>}>
      <LinearGradient
        colors={["#12BD37", "#3059AD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Define gradient size */}
        <Text style={[styles.name, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}


function ProfileItem({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>
        {label}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  /* Screen background */
  container: {
    flex: 1,
    backgroundColor: "#BCD1F0",
  },

  /* Top header container */
  header: {
    height: 260,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  /* "Profile" title */
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },

  /* Floating avatar placeholder */
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

  /* White card container */
  card: {
    marginTop: 80,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    elevation: 5,
  },

  /* Username text */
  name: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
  },

  /* Row container */
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  /* Row text */
  itemText: {
    fontSize: 16,
    color: "#404040",
  },

  /* Chevron arrow */
  chevron: {
    fontSize: 22,
    color: "#9CA3AF",
  },
});