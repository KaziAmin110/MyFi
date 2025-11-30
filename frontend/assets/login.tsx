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
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
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

  // Configure Google Sign-In when component mounts
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });

    // Check if user is already logged in
    checkLoginStatus();
  }, []);

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
    setGoogleLoading(true);
    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      await GoogleSignin.signIn();

      // Get the ID token
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      // Send token to your backend
      const response = await axios.post(API_ENDPOINTS.oauthSignIn, {
        provider: "google",
        token: idToken,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data;

        // Store tokens and user data
        await tokenStorage.saveTokens(accessToken, refreshToken);
        await tokenStorage.saveUser(user);

        Alert.alert("Success", "Signed in with Google successfully!");
        router.replace("/account/dashboard");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled Google sign-in");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google sign-in in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available");
      } else {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Google sign-in failed";
        Alert.alert("Error", message);
        console.error("Google Sign-In Error:", error);
      }
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

      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            "Forgot Password",
            "This feature will be implemented soon"
          )
        }
      >
        <Text className="text-right text-sm text-gray-600 mb-1">
          Forgot password?
        </Text>
      </TouchableOpacity>

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
