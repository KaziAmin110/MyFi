import { Text, View } from "react-native";
import React from 'react'
import { Link } from "expo-router";

const login = () => {
    return (
        <View className="flex-1 justify-center items-center">
            <Text className="font-bold">Welcome Back!</Text>
            <Text className="">Email Address</Text>
            <Text className="">Password</Text>

            <Link href="/register">Don't have an account? Sign Up</Link>
        </View>
    )
}
export default login