import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Image
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getUserContext, updateProfile, changePassword, updateAvatar, UserData } from "../../services/user.service";
import { Ionicons } from "@expo/vector-icons";

export const API_URL = "http://localhost:5500/api/auth";

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

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals Visibility
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form States
  const [newName, setNewName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await getUserContext();
      setUser(data.user);
      setNewName(data.user.name);
    } catch (error) {
      console.error("Failed to load user context:", error);
      // Fallback to local store if API fails
      const stored = await SecureStore.getItemAsync("user");
      if (stored) setUser(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
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
      // Update local storage too
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
      // Clear password fields
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
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need access to your photos to update your profile picture.");
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Prepare FormData
        const formData = new FormData();
        const uriParts = selectedImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        // @ts-ignore - React Native FormData expects an object for the file
        formData.append("avatar", {
          uri: selectedImage.uri,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        });

        setUploadingAvatar(true);
        const updatedUser = await updateAvatar(formData);
        setUser(updatedUser);
        
        // Update local storage
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", error.message || "Failed to update profile picture.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading && !user) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3059AD" />
      </View>
    );
  }


  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 90 }]}>
      {/* Avatar Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#A5C2F0", "#BCD1F0"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#3059AD" />
            </View>
          )}
          
          {uploadingAvatar ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.editAvatarButton} 
              onPress={handleEditAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.card}>
          {/* Gradient username */}
          <GradientText text={user?.name || "User"} />

          {/* Account Actions */}
          <ProfileItem
            label="Update Profile"
            icon="person-outline"
            onPress={() => setIsUpdateModalVisible(true)}
          />

          <ProfileItem
            label="Change Password"
            icon="lock-closed-outline"
            onPress={() => setIsPasswordModalVisible(true)}
          />

          <ProfileItem 
            label="Log Out" 
            icon="log-out-outline"
            onPress={handleLogout} 
            isDestructive
          />
        </View>
      </View>

      {/* Update Profile Modal */}
      <Modal
        visible={isUpdateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsUpdateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsUpdateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleUpdateProfile}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <Text style={styles.inputLabel}>Old Password</Text>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter old password"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleChangePassword}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GradientText({ text }: { text: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <MaskedView maskElement={<Text style={styles.name}>{text}</Text>}>
        <LinearGradient
          colors={["#12BD37", "#3059AD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.name, { opacity: 0 }]}>{text}</Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

function ProfileItem({
  label,
  icon,
  onPress,
  isDestructive = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isDestructive ? "#EF4444" : "#404040"} 
          style={{ marginRight: 12 }} 
        />
        <Text style={[styles.itemText, isDestructive && { color: "#EF4444" }]}>
          {label}
        </Text>
      </View>
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
    height: 200, // Reduced height now that title is gone
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    position: "absolute",
    bottom: -60, // Sits half-way out of the header
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    borderWidth: 4, // Increased border thickness
    borderColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: "visible", // To allow button to show clearly
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60, // Ensure image itself is also rounded
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3059AD",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginTop: 80, // Explicitly push below the avatar (which is -60)
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#404040",
    fontWeight: "500",
  },
  chevron: {
    fontSize: 22,
    color: "#9CA3AF",
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#1F2937",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#3059AD",
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    // Removed justifyContent: "center" to prevent card from being pulled up
  },
});
