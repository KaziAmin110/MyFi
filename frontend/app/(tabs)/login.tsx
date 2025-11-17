import { Text, TextInput, View } from "react-native";
import React, { useState } from 'react'
import { Link } from "expo-router";

const login = () => {
    const [emailAddress, onChangeText3] = useState('');
    const [password, setPassword] = useState('');

    // Track password visibility
    const [showPassword, setShowPassword] = useState(false);

    // Toggle the password visibility state
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <View className="flex-1 justify-center items-center">
            <Text className="font-bold">Welcome Back!</Text>
            <Text className="">Email Address</Text>
            <TextInput
                value={emailAddress}
                onChangeText={onChangeText3}
                placeholder="Enter your email address"
                placeholderTextColor=""
                className=""
            />
            <Text className="">Password</Text>
            <TextInput
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••"
                placeholderTextColor=""
            />

            <Link href="/register">Don't have an account? Sign Up</Link>
        </View>
    )
}
export default login