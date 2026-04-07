import {
  TextInput,
  TouchableOpacity,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import React, { useState } from "react";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { API_URL } from "../../utils/api";
import { Feather } from "@expo/vector-icons";

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  //Password must be at least 7 characters, including a number and special character
  const checkNewPassword = (password: string) => {
    return (
      password.length >= 7 &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const isPasswordValid = checkNewPassword(password);

  const doPasswordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const { token } = useLocalSearchParams<{ token?: string }>();

  const newPasswordRequest = async () => {
    if (!isPasswordValid || !doPasswordsMatch) return;

    setIsLoading(true);
    console.log("Reset token:", token);
    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset_token: token, new_password: password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Password reset successful.");
        router.push("/login");
      } else alert(data.message || "Failed to reset password.");
    } catch (error) {
      if (error instanceof Error) alert("Error: " + error.message);
      else alert("An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
              <Feather name="key" size={32} color="#345995" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
              Create New Password
            </Text>
            <Text className="text-base text-gray-500 text-center px-4">
              Your new password must be unique from those previously used.
            </Text>
          </View>

          <View className="flex flex-col gap-5 space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                New Password
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4 h-14 focus:border-[#345995] focus:bg-white transition-all">
                <Feather
                  name="lock"
                  size={20}
                  color="#9CA3AF"
                  className="mr-3"
                />
                <TextInput
                  className="flex-1 text-base text-gray-900 h-full"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {password.length > 0 && !isPasswordValid && (
                <View className="flex-row items-start mt-2 ml-1">
                  <Feather
                    name="alert-circle"
                    size={14}
                    color="#EF4444"
                    style={{ marginTop: 2, marginRight: 4 }}
                  />
                  <Text className="text-red-500 text-xs flex-1">
                    Must be at least 7 chars with a number & special char
                  </Text>
                </View>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                Confirm Password
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4 h-14 focus:border-[#345995] focus:bg-white transition-all">
                <Feather
                  name="check-circle"
                  size={20}
                  color="#9CA3AF"
                  className="mr-3"
                />
                <TextInput
                  className="flex-1 text-base text-gray-900 h-full"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && !doPasswordsMatch && (
                <View className="flex-row items-center mt-2 ml-1">
                  <Feather
                    name="alert-circle"
                    size={14}
                    color="#EF4444"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-red-500 text-xs">
                    Passwords must match
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              disabled={!isPasswordValid || !doPasswordsMatch || isLoading}
              className={`h-14 rounded-full items-center justify-center shadow-sm ${!isPasswordValid || !doPasswordsMatch || isLoading ? "bg-gray-300" : "bg-[#345995] shadow-blue-200"}`}
              onPress={newPasswordRequest}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8 items-center">
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-gray-400 text-sm">Back to Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewPassword;
