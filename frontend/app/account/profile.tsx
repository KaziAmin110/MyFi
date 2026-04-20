import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  getUserContext,
  updateProfile,
  changePassword,
  updateAvatar,
  UserData,
} from "../../services/user.service";
import { Ionicons } from "@expo/vector-icons";
import { API_URL as BASE_URL } from "../../utils/api";

export const API_URL = `${BASE_URL}/auth`;

export const signOut = async () => {
  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(`${API_URL}/sign-out`, {
    method: "POST",
    headers: {
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
    await signOut();
  } catch (error) {
    console.log("Backend logout failed:", error);
  }

  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("user");
  router.replace("/(tabs)");
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Constants ───────────────────────────────────────────────────────────────
const HERO_HEIGHT = 200;
const AVATAR_SIZE = 150;
const AVATAR_BORDER = 5;

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newName, setNewName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await getUserContext();
      setUser(data.user);
      setNewName(data.user.name);
    } catch (error) {
      console.error("Failed to load user context:", error);
      const stored = await SecureStore.getItemAsync("user");
      if (stored) setUser(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === "granted");
  };

  const openNotificationSettings = () => {
    // iOS: app-settings: opens THIS app's Settings page (includes Notifications toggle)
    // Android: opens app notification settings directly
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          "Notifications Blocked",
          "To enable notifications, please allow access in your device Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openNotificationSettings },
          ]
        );
      }
    } else {
      Alert.alert(
        "Disable Notifications",
        "To turn off notifications, please go to your device Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openNotificationSettings },
        ]
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
      checkNotificationPermission();
    }, []),
  );

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    try {
      setActionLoading(true);
      const updatedUser = await updateProfile(newName);
      setUser(updatedUser);
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      Alert.alert("Success", "Profile updated successfully");
      setIsUpdateModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    try {
      setActionLoading(true);
      await changePassword(oldPassword, newPassword);
      Alert.alert("Success", "Password changed successfully");
      setIsPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your photos to update your profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        if (user) setUser({ ...user, avatar_url: selectedImage.uri });

        const formData = new FormData();
        const uriParts = selectedImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        // @ts-ignore
        formData.append("avatar", {
          uri: selectedImage.uri,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        });

        setUploadingAvatar(true);
        const updatedUser = await updateAvatar(formData);
        setUser(updatedUser);
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile picture.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3059AD" />
      </View>
    );
  }

  const avatarPullUp = AVATAR_SIZE / 2 + AVATAR_BORDER;

  return (
    <LinearGradient
      colors={["#FFFFFF", "rgba(188, 209, 240, 0.4)"]}
      locations={[0.5, 1]}
      style={styles.root}
    >
      {/* ── topGradient image overlay — identical to chat screen ────── */}
      <Image
        source={require("../../assets/images/resultDisplay/topGradient.png")}
        style={styles.topGradientImg}
        resizeMode="stretch"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          {/* No inner gradient — the topGradient image handles the top colour */}
          {/* Spacer so the avatar hangs off the bottom */}
          <View style={{ height: avatarPullUp }} />
        </View>

        {/* ── Avatar ─────────────────────────────────────────────────── */}
        <View style={[styles.avatarWrapper, { marginTop: -avatarPullUp }]}>
          <TouchableOpacity
            onPress={handleEditAvatar}
            activeOpacity={0.85}
            disabled={uploadingAvatar}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={styles.avatarImage}
                    fadeDuration={0}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.initialsText}>
                      {getInitials(user?.name || "?")}
                    </Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>

              {!uploadingAvatar && (
                <View style={styles.cameraBtn}>
                  <Ionicons name="camera" size={13} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Name & Email ────────────────────────────────────────────── */}
        <View style={styles.nameBlock}>
          <MaskedView
            maskElement={
              <Text style={styles.displayName}>{user?.name || "User"}</Text>
            }
          >
            <LinearGradient
              colors={["#12BD37", "#3059AD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.displayName, { opacity: 0 }]}>
                {user?.name || "User"}
              </Text>
            </LinearGradient>
          </MaskedView>

          {user?.email ? (
            <Text style={styles.emailText}>{user.email}</Text>
          ) : null}
        </View>

        {/* ── ACCOUNT section ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="person-outline"
              label="Update Profile"
              onPress={() => setIsUpdateModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setIsPasswordModalVisible(true)}
            />
            <View style={styles.divider} />
            <NotificationRow
              enabled={notificationsEnabled}
              onToggle={handleToggleNotifications}
            />
          </View>
        </View>

        {/* ── SESSION section ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SESSION</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
              isDestructive
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Update Profile Modal ─────────────────────────────────────── */}
      <Modal
        visible={isUpdateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsUpdateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Update Profile</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsUpdateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleUpdateProfile}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ────────────────────────────────────── */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleChangePassword}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  onPress,
  isDestructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  const iconColor = isDestructive ? "#EF4444" : "#3059AD";
  const badgeBg = isDestructive ? "#FEF2F2" : "#EBF2FF";
  const labelColor = isDestructive ? "#EF4444" : "#1F2937";
  const chevronColor = isDestructive ? "#FCA5A5" : "#B8CBE8";

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={chevronColor} />
    </TouchableOpacity>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotificationRow({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, { backgroundColor: "#EBF2FF" }]}>
        <Ionicons
          name={enabled ? "notifications-outline" : "notifications-off-outline"}
          size={17}
          color="#3059AD"
        />
      </View>
      <Text style={[styles.rowLabel, { color: "#1F2937" }]}>Notifications</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
        thumbColor={enabled ? "#3059AD" : "#9CA3AF"}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  // ── Chat-matching top gradient image ──────────────────────────────
  topGradientImg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 200,
  },

  // ── Hero ──────────────────────────────────────────────────────────
  hero: {
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },

  // ── Avatar ────────────────────────────────────────────────────────
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 6,
  },
  avatarRing: {
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3059AD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 14,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#D5E6FF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3059AD",
  },
  initialsText: {
    fontSize: 48,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3059AD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Name block ────────────────────────────────────────────────────
  nameBlock: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  displayName: {
    fontSize: 35,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emailText: {
    marginTop: 4,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  // ── Sections ──────────────────────────────────────────────────────
  section: {
    marginHorizontal: 20,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3059ad",
    letterSpacing: 1.3,
    marginBottom: 8,
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#3059AD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEF3FB",
    marginLeft: 58,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  // ── Modals ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: "#1F2937",
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  saveBtn: {
    backgroundColor: "#3059AD",
  },
  cancelBtnText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
