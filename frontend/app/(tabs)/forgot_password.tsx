import {TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React from 'react'

const ForgotPassword = () => {
    return(
        <View className="flex-1 items-center justify-center bg-[#F1F2F4]]">
            <Text className="font-inter font-semibold text-[35px] text-center">Enter the email associated with your account</Text>
            <Text className="mt-5 font-inter text-[20px] text-[#4E4A4A]">We will send you a link to reset your password</Text>
            
            <View className="items-start">
                <Text className="mt-10 px-4 text-left">Email:</Text>
                <TextInput className="px-4 w-250 h-10 bg-[#D9D9D9] rounded-[90px]"
                placeholder="Enter your email">
                </TextInput>
            </View>

            <Link href="/forgot_code">
                <TouchableOpacity
                    className="mt-3 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center">
                    <Text className="text-white text-[15px]">Submit</Text>
                </TouchableOpacity>
            </Link>

            <Link href="/login">Return to Login</Link>
        </View>
    )
}

export default ForgotPassword