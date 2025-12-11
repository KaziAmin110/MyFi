import {TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React from 'react'
import OTPTextInput from "react-native-otp-textinput";


const NewPassword = () => {
    return(
        <View className="flex-1 items-center justify-center bg-[#F1F2F4]]">
            <Text className="font-inter font-semibold text-[35px] text-center">Create a new password</Text>
            
            <View className="mt-10">
                
            </View>

            <TouchableOpacity
                className="mt-8 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center">
                <Text className="text-white text-[15px]">Confirm</Text>
            </TouchableOpacity>

            <Link href="/login">Return to Login</Link>
        </View>
    )
}

export default NewPassword