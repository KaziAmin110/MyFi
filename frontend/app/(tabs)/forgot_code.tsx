import {TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React from 'react'
import OTPTextInput from "react-native-otp-textinput";


const ForgotCode = () => {
    return(
        <View className="flex-1 items-center justify-center bg-[#F1F2F4]]">
            <Text className="font-inter font-semibold text-[35px] text-center">Please enter the code sent to your email</Text>
            
            <View className="mt-10">
                <OTPTextInput
                inputCount={6}
                tintColor="#D9D9D9"
                offTintColor="#D9D9D9"
                containerStyle={{ width: "80%" }}
                textInputStyle={{
                    width: 50,
                    height: 60,
                    borderRadius: 12,
                    backgroundColor: "#D9D9D9"
                }}
                >
                </OTPTextInput>
            </View>

            <TouchableOpacity
                className="mt-8 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center">
                <Text className="text-white text-[15px]">Confirm</Text>
            </TouchableOpacity>

            <Link href="/login">Return to Login</Link>
        </View>
    )
}

export default ForgotCode