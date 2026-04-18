import { ScrollView, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import React, { useState } from 'react'
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../../lib/supabase";
import { signIn } from "./login";

import { API_URL as BASE_URL } from "../../utils/api";

WebBrowser.maybeCompleteAuthSession();

export const API_URL = `${BASE_URL}/auth`;

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok)
    throw new Error(json.message || "Registration failed");

  return json;
}

const Register = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // track password visibility
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
                    acc[key] = value;
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
        if (refreshToken) await SecureStore.setItemAsync("refreshToken", String(refreshToken));
        if (user) await SecureStore.setItemAsync("user", JSON.stringify(user));

        // New user — always needs onboarding
        router.replace("../takeAssessment");
    }, []);


    const handleRegister = async () => {
        setLoading(true);
        setError("");

        if (!firstName || !lastName || !email || !password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        try {
            await signUp({
                name: `${firstName} ${lastName}`.trim(),
                email,
                password
            });

            // Auto-login after registration
            const loginData = await signIn({ email, password });
            const token = loginData.accessToken ?? loginData.token ?? loginData.jwt;
            const refreshToken = loginData.refreshToken;
            const user = loginData.user;

            if (token) await SecureStore.setItemAsync("token", String(token));
            if (refreshToken) await SecureStore.setItemAsync("refreshToken", String(refreshToken));
            
            if (user) {
              await SecureStore.setItemAsync("user", JSON.stringify(user));
            }

            // New user — always needs onboarding
            router.replace("../takeAssessment");
        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-16">
            <TouchableOpacity onPress={() => router.replace("/")} className="mb-8">
                <Image
                    source={require("../../assets/images/back.png")}
                    className="w-6 h-6"
                    resizeMode="contain"
                />
            </TouchableOpacity>

            <Text className="text-center #151414 text-3xl font-semibold mb-8" >Get Started</Text>

            <Text className="mb-1 font-medium text-black">First Name</Text>
            <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#BABABA"
                className="bg-light rounded-xl px-4 py-3 mb-4"
            />
            <Text className="mb-1 font-medium text-black">Last Name</Text>
            <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor="#BABABA"
                className="bg-light rounded-xl px-4 py-3 mb-4"
            />
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
                className="bg-light rounded-xl px-4 py-3 mb-4"
            />
            <Text className="mb-1 font-medium text-black">Password</Text>
            <View className="bg-light rounded-xl px-4 py-3 mb-4 flex-row items-center">
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

            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}

            <TouchableOpacity
                disabled={loading}
                onPress={handleRegister}
                className="bg-primary rounded-xl py-4 mt-5 mb-10 shadow-md shadow-blue-200"
            >
                <Text className="text-center text-white font-medium text-lg">
                    {loading ? "Registering..." : "Register"}
                </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-black" />
                <Text className="mx-3 text-black">or</Text>
                <View className="flex-1 h-px bg-black" />
            </View>

            <View className="flex-row justify-center space-x-8 mb-10">
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
                <Text className="text-black">Already have an account? </Text>
                <Link href="/login" className="font-semibold text-black">Log in</Link>
            </View>
        </ScrollView>
    )
}
export default Register