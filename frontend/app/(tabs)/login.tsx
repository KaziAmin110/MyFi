import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { GOOGLE_WEB_CLIENT_ID } from "../../config/oauth";
import { tokenStorage } from "../../utils/tokenStorage";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Track password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Use Expo's auth proxy for consistent redirect URI
  const redirectUri = "https://auth.expo.io/@myfi/myfi";

  // Configure Expo Google Auth - use code flow instead of id_token
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  // Debug: Log request configuration
  useEffect(() => {
    console.log("🔧 OAuth Request Config:", {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      request: request ? "Request object exists" : "No request object",
    });
  }, [request]);

  // Debug: Log all response changes
  useEffect(() => {
    console.log("📱 OAuth Response changed:", response);
    if (response) {
      console.log("Response type:", response.type);
      if ("authentication" in response) {
        console.log("Authentication data:", response.authentication);
      }
      if ("error" in response) {
        console.log("Error data:", response.error);
      }
    }
  }, [response]);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkLoginStatus();
  }, []);
  z;
  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("✅ OAuth Success, authentication:", authentication);
      // Try idToken first, fall back to accessToken
      const token = authentication?.idToken || authentication?.accessToken;
      if (token) {
        handleGoogleAuthSuccess(token);
      } else {
        console.error("❌ No token received from Google");
        Alert.alert("Error", "Failed to get authentication token");
        setGoogleLoading(false);
      }
    } else if (response?.type === "error") {
      console.error("❌ OAuth Error:", response.error);
      Alert.alert("Error", response.error?.message || "Authentication failed");
      setGoogleLoading(false);
    }
  }, [response]);

  const checkLoginStatus = async () => {
    const isLoggedIn = await tokenStorage.isLoggedIn();
    if (isLoggedIn) {
      router.replace("/account/dashboard");
    }
  };

  // Handle regular email/password login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.signIn, {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data;

        // Store tokens and user data
        await tokenStorage.saveTokens(accessToken, refreshToken);
        await tokenStorage.saveUser(user);

        Alert.alert("Success", "Logged in successfully!");
        router.replace("/account/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    try {
      console.log("🔵 Starting Google Sign-In...");
      console.log("Request ready?", !!request);
      setGoogleLoading(true);

      const result = await promptAsync();
      console.log("🎯 promptAsync result:", result);
    } catch (error) {
      console.error("❌ Google Sign-In Error:", error);
      Alert.alert("Error", "Failed to initiate Google sign-in");
      setGoogleLoading(false);
    }
  };

  // Handle successful Google authentication
  const handleGoogleAuthSuccess = async (token: string | undefined) => {
    if (!token) {
      Alert.alert("Error", "Failed to get Google token");
      setGoogleLoading(false);
      return;
    }

    try {
      console.log("✅ Got Google token, sending to backend...");

      // Send token to your backend
      const response = await axios.post(API_ENDPOINTS.oauthSignIn, {
        provider: "google",
        token: token,
      });

      if (response.data.success) {
        const { accessToken: jwtToken, refreshToken, user } = response.data;

        // Store tokens and user data
        await tokenStorage.saveTokens(jwtToken, refreshToken);
        await tokenStorage.saveUser(user);

        Alert.alert("Success", "Signed in with Google successfully!");
        router.replace("/account/dashboard");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Google sign-in failed";
      Alert.alert("Error", message);
      console.error("❌ Backend OAuth Error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 px-6 pt-16 bg-white">
      <TouchableOpacity onPress={() => router.replace("/")} className="mb-8">
        <Image
          source={require("../../assets/images/back.png")}
          className="w-6 h-6"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text className="text-center #151414 text-3xl font-semibold mb-8">
        Welcome Back!
      </Text>

      <Text className="mb-1 font-medium text-black">Email Address</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Show "@" key on the keyboard
        autoCapitalize="none" // prevent capitalization of the first letter
        autoComplete="email" // iOS autofill
        autoCorrect={false} // disable autocorrect
        placeholder="Enter your email address"
        placeholderTextColor="#BABABA"
        className="px-4 py-3 mb-4 bg-light rounded-xl"
      />
      <Text className="mb-1 font-medium text-black">Password</Text>
      <View className="flex-row items-center px-4 mb-4 bg-light rounded-xl">
        <TextInput
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none" // prevent capitalization of the first letter
          placeholder="••••••••••"
          placeholderTextColor="#BABABA"
          className="flex-1"
        />

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Image
            source={
              showPassword
                ? require("../../assets/images/eye-off.png")
                : require("../../assets/images/eye.png")
            }
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Link href="/(tabs)/login" className="text-right text-sm #111010">
        Forgot password?
      </Link>

      <TouchableOpacity
        className="py-4 mt-5 mb-20 bg-primary rounded-xl"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-lg font-medium text-center text-white">
            Log in
          </Text>
        )}
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-black" />
        <Text className="mx-3 text-black">Log in with</Text>
        <View className="flex-1 h-px bg-black" />
      </View>

      <View className="flex-row justify-center mb-10 space-x-8">
        <TouchableOpacity onPress={handleGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? (
            <ActivityIndicator size="large" color="#4285F4" />
          ) : (
            <Image
              source={require("../../assets/images/google.png")}
              className="w-10 h-10 mr-5"
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require("../../assets/images/apple.png")}
            className="w-10 h-10 ml-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center pb-10">
        <Text className="text-black">Don&apos;t have an account? </Text>
        <Link href="/register" className="font-semibold text-black">
          Sign up
        </Link>
      </View>
    </ScrollView>
  );
};
export default Login;
