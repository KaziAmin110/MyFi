import { Text, TextInput, View } from "react-native";
import React, { useState } from 'react'
import { Link } from "expo-router";

const register = () => {
    const [firstName, onChangeText1] = useState('');
    const [lastName, onChangeText2] = useState('');
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
            <Text className="font-bold">Get Started</Text>
            <Text className="">First Name</Text>
            <TextInput
                value={firstName}
                onChangeText={onChangeText1}
                placeholder="Enter your first name"
                placeholderTextColor=""
                className=""
            />
            <Text className="">Last Name</Text>
            <TextInput
                value={lastName}
                onChangeText={onChangeText2}
                placeholder="Enter your last name"
                placeholderTextColor=""
                className=""
            />
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

            <Link href="/login">Already have an account? Log in</Link>
        </View>
    )
}
export default register