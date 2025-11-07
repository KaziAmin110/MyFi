import { Text, View } from "react-native";
import React from 'react'
import { Link } from "expo-router";

const register = () => {
    return (
        <View className="flex-1 justify-center items-center">
            <Text className="font-bold">Get Started</Text>
            <Text className="">First Name</Text>
            <Text className="">Last Name</Text>
            <Text className="">Email Address</Text>
            <Text className="">Password</Text>

            <Link href="/login">Already have an account? Log in</Link>
        </View>
    )
}
export default register