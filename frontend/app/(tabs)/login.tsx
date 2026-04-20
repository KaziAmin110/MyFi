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
import { API_URL as BASE_URL } from "../../utils/api";
import {scale, verticalScale, moderateScale, moderateVerticalScale} from "../../utils/scale";

WebBrowser.maybeCompleteAuthSession();

export const API_URL = `${BASE_URL}/auth`;

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
  const [showPassword, setShowPassword] = useState(false);
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
        const fragment = result.url.split("#")[1];
        if (!fragment) throw new Error("No fragment found in redirect URL");

        const params = fragment.split("&").reduce((acc, part) => {
          const [key, value] = part.split("=");
          acc[decodeURIComponent(key)] = decodeURIComponent(value);
          return acc;
        }, {} as any);

        const supabase_access_token = params.access_token;

        if (!supabase_access_token) throw new Error("No access token found in redirect URL");

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ paddingHorizontal: scale(24) }}
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: verticalScale(32), paddingBottom: verticalScale(40) }}
    >
      <TouchableOpacity onPress={() => router.replace("/")} style={{ marginBottom: verticalScale(32) }}
       hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
       >
        <Image
          source={require("../../assets/images/back.png")}
          style={{ width: scale(24), height: scale(24) }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={{ fontSize: moderateScale(32), marginBottom: verticalScale(45) }} className="text-center text-[#151414] font-semibold">
        Welcome Back!
      </Text>

      <Text style={{ fontSize: moderateScale(16), marginBottom: verticalScale(4) }} className="font-medium text-black">Email Address</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        placeholder="moneyhabitudes@example.com"
        placeholderTextColor="#797676"  
        style={{ paddingVertical: verticalScale(12), paddingHorizontal: scale(16), fontSize: moderateScale(15), marginBottom: verticalScale(14) }}
        className="bg-white rounded-xl border border-[#747775]"
      />

      <Text style={{ fontSize: moderateScale(16), marginBottom: verticalScale(4) }} className="font-medium text-black">Password</Text>
      <View style={{ paddingVertical: verticalScale(12), paddingHorizontal: scale(16), marginBottom: verticalScale(14) }} 
      className="bg-white rounded-xl border border-[#747775] flex-row items-center">
        <TextInput
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"   
          placeholder="•••••••••••••••"
          placeholderTextColor="#797676"
          style={{ fontSize: moderateScale(15) }}
          className="flex-1"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Image
            source={
              showPassword
                ? require("../../assets/images/eye-off.png")
                : require("../../assets/images/eye.png")
            }
            style={{ width: scale(18), height: scale(18) }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Link href="/forgot_password" style={{ fontSize: moderateScale(13), textAlign: "right", color: "#111010", marginBottom: verticalScale(8) }}>
        Forgot password?
      </Link>

      {error ? <Text style={{ fontSize: moderateScale(13) }} className="text-red-500 mb-2">{error}</Text> : null}

      <TouchableOpacity
        disabled={loading}
        onPress={handleLogin}
        style={{ paddingVertical: verticalScale(14), marginTop: verticalScale(16), marginBottom: verticalScale(24) }}
        className="bg-primary shadow-md shadow-blue-200 rounded-full"
      > 
        <Text style={{ fontSize: moderateScale(17) }} className="text-center text-white font-semibold">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <View style={{ marginBottom: verticalScale(20) }} className="flex-row items-center">
        <View className="flex-1 h-px bg-[#747775]" />
        <Text style={{ fontSize: moderateScale(16) }} className="mx-3 text-black">Or</Text>
        <View className="flex-1 h-px bg-[#747775]" />
      </View>

      <View className="mb-4 items-center w-full">
            <TouchableOpacity
                disabled={loading}
                onPress={handleGoogleLogin}
                className={`flex-row items-center justify-center w-full rounded-full border border-[#747775] bg-white px-4 py-3 gap-x-2.5 ${loading ? "opacity-60" : "opacity-100"}`}
                activeOpacity={0.7}
                
            >
                <Image
                source={require("../../assets/images/google.png")}
                style={{ width: scale(25), height: scale(25) }}
                resizeMode="contain"
                />
                <Text className="font-medium text-lg text-[#1F1F1F] tracking-wide">
                Continue with Google
                </Text>
            </TouchableOpacity>
      </View>

      <View className="flex-row justify-center">
          <Text style={{ fontSize: moderateScale(15) }}>
            Don't have an account?{" "}
            <Link href="/register" asChild>
              <Text style={{ color: "#345995", fontWeight: "700" }}>
                Sign up
              </Text>
            </Link>
          </Text>

      </View>
    </ScrollView>
  );
};
export default Login;