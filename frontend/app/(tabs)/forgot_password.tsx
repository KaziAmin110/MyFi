import {
  TextInput,
  TouchableOpacity,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Link } from "expo-router";
import React, { useState } from "react";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { API_URL } from "../../utils/api";
import {scale} from "../../utils/scale";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkEmail = (email: string) => {
    if (!email) {
      alert("Please enter an email address.");
      return false;
    }
    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormat.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const emailRequest = async () => {
    if (!checkEmail(email)) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        router.push("/email_token");
      } else alert(data.message || "Error sending code to the email address.");
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
      className="flex-1 bg-white ml-[-1] mt-[-1]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
          <Image
            source={require("../../assets/images/logoGradient.png")}
            style={{
              width: scale(150),
              height: scale(150),
              resizeMode: "contain",
              alignSelf: "center",
            
            }}
          />
            <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
              Forgot Password?
            </Text>
            <Text className="text-base text-gray-500 text-center px-4">
              Please enter the email address associated with your account.
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                Email Address
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4 h-14 focus:border-[#345995] focus:bg-white transition-all">
                <Feather
                  name="mail"
                  size={20}
                  color="#9CA3AF"
                  className="mr-3"
                />
                <TextInput
                  className="flex-1 text-base text-gray-900 h-full"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity
              className={`h-14 rounded-full items-center justify-center shadow-md shadow-blue-200 mt-6 ${isLoading ? "bg-[#345995]/70" : "bg-[#345995]"}`}
              onPress={emailRequest}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Send Code
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8 flex-row justify-center items-center">
            <Text className="text-gray-500 text-sm">Remember Password? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-[#345995] font-semibold text-sm">
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
