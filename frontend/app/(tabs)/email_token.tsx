import {
  TextInput,
  TouchableOpacity,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import React, { useState } from "react";
import OTPTextInput from "react-native-otp-textinput";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

const EmailToken = () => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkToken = (token: string) => {
    const tokenPattern = /^[A-Za-z0-9]{6}$/;
    if (!tokenPattern.test(token)) {
      alert("Please enter a 6-digit code.");
      return false;
    }
    return true;
  };

  const codeRequest = async () => {
    const cleanToken = token.replace(/\s/g, "").toUpperCase();

    if (!checkToken(cleanToken)) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5500/api/auth/verify-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset_token: cleanToken }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: "/new_password",
          params: { token: cleanToken },
        });
      } else alert(data.message || "Error verifying the token.");
    } catch (error) {
      console.error(error);
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
        <View className="flex-1 px-6 justify-center items-center">
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
            <Feather name="shield" size={32} color="#345995" />
          </View>

          <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
            OTP Verification
          </Text>

          <Text className="text-md text-gray-500 text-center px-4 mb-10">
            Enter the verification code sent to your email address:
          </Text>

          <View className="w-full items-center mb-8">
            <OTPTextInput
              inputCount={6}
              handleTextChange={setToken}
              tintColor="#345995"
              offTintColor="#E5E7EB"
              containerStyle={{
                width: "100%",
                justifyContent: "center",
                gap: 8,
              }}
              textInputStyle={
                {
                  width: 45,
                  height: 55,
                  borderWidth: 1,
                  borderBottomWidth: 1,
                  borderRadius: 12,
                  backgroundColor: "#F9FAFB",
                  fontSize: 20,
                  color: "#1F2937",
                  fontWeight: "600",
                } as any
              }
              autoCapitalize="characters"
              keyboardType="default"
            />
          </View>

          <TouchableOpacity
            className={`h-14 w-full rounded-full items-center justify-center shadow-md shadow-blue-200 mb-6 ${isLoading ? "bg-[#345995]/70" : "bg-[#345995]"}`}
            onPress={codeRequest}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-500 text-sm">Didn't receive code? </Text>
            <TouchableOpacity>
              <Text className="text-[#345995] font-semibold text-sm">
                Resend
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
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

export default EmailToken;
