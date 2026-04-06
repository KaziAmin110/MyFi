import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import React, { useState } from "react";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../../lib/supabase";
import { getUserContext } from "../../services/user.service";

WebBrowser.maybeCompleteAuthSession();

// NOTE: Use your computer's local IP address (e.g., 192.168.x.x) instead of localhost 
// so the simulator can connect to your backend server.
export const API_URL = "http://localhost:5500/api/auth";

export async function signIn(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Login failed");

  return json;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Track password visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'myfi',
        path: 'google-auth',
      });
      
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error("No URL returned from Supabase OAuth");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === "success" && result.url) {
        // Parse the token from the URL fragment
        const fragment = result.url.split("#")[1];
        if (!fragment) throw new Error("No fragment found in redirect URL");

        const params = fragment.split("&").reduce((acc, part) => {
          const [key, value] = part.split("=");
          acc[decodeURIComponent(key)] = decodeURIComponent(value);
          return acc;
        }, {} as any);

        const supabase_access_token = params.access_token;

        if (!supabase_access_token) throw new Error("No access token found in redirect URL");

        // Exchange Supabase token for our backend JWT
        const res = await fetch(`${API_URL}/google-signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supabase_access_token }),
        });

        const backendData = await res.json();
        if (!res.ok) throw new Error(backendData.message || "Backend authentication failed");

        await handleAuthSuccess(backendData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = React.useCallback(async (data: any) => {
    const token = data.accessToken ?? data.token ?? data.jwt;
    const refreshToken = data.refreshToken;
    const user = data.user;

    if (token) await SecureStore.setItemAsync("token", String(token));
    if (refreshToken)
      await SecureStore.setItemAsync("refreshToken", String(refreshToken));
    if (user) await SecureStore.setItemAsync("user", JSON.stringify(user));

    try {
      const context = await getUserContext();
      if (!context.user.onboarding_completed) {
        router.replace("../takeAssessment");
      } else {
        router.replace("/account/dashboard");
      }
    } catch (contextErr) {
      console.error("Failed to fetch user context:", contextErr);
      router.replace("/account/dashboard");
    }
  }, []);


  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await signIn({ email, password });

      // Extract what the backend returns
      const token = data.accessToken ?? data.token ?? data.jwt;
      const refreshToken = data.refreshToken;
      const user = data.user;

      // Store safely
      if (token) await SecureStore.setItemAsync("token", String(token));
      if (refreshToken)
        await SecureStore.setItemAsync("refreshToken", String(refreshToken));

      if (user) {
        await SecureStore.setItemAsync("user", JSON.stringify(user));
      }

      // Check onboarding status before navigating
      try {
        const context = await getUserContext();
        if (!context.user.onboarding_completed) {
          router.replace("../takeAssessment");
        } else {
          router.replace("/account/dashboard");
        }
      } catch (contextErr) {
        // Fallback — if context call fails, go to dashboard
        console.error("Failed to fetch user context:", contextErr);
        router.replace("/account/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <View className="flex-row items-center px-4 py-3 mb-4 bg-light rounded-xl">
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
            className="w-4 h-4"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Link href="/forgot_password" className="text-right text-sm #111010">
        Forgot password?
      </Link>

      {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}

      <TouchableOpacity
        disabled={loading}
        onPress={handleLogin}
        className="py-4 mt-5 mb-20 bg-primary rounded-xl"
      >
        <Text className="text-lg font-medium text-center text-white">
          {loading ? "Logging in..." : "Log in"}
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-black" />
        <Text className="mx-3 text-black">Log in with</Text>
        <View className="flex-1 h-px bg-black" />
      </View>

      <View className="flex-row justify-center mb-10 space-x-8">
        <TouchableOpacity
          disabled={loading}
          onPress={handleGoogleLogin}
        >
          <Image
            source={require("../../assets/images/google.png")}
            className="w-10 h-10 mr-5"
            resizeMode="contain"
          />
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
