import {TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React, { useState } from "react";
import { router } from "expo-router";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");

    const checkEmail = (email:string) => {
        if(!email)
        {
            alert("Please enter an email address.");
            return false;
        }
        const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailFormat.test(email))
        {
            alert("Please enter a valid email address.");
            return false;
        }
        return true;
    }

    const emailRequest = async () => {
        if(!checkEmail(email))
            return;

        try{
            const response = await fetch("http://localhost:5500/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            console.log(data);

            if(response.ok)
            {
                alert("Check your email for the verification code.");
                router.push("/email_token");
            }

            else
                alert(data.message || "Error sending code to the email address.");
        }catch(error){
            if(error instanceof Error)
                alert("Error: " + error.message);
            else
                alert("An unknown error occurred.");
        }
    }

    return(
        <View className="flex-1 items-center justify-center bg-[#F1F2F4]]">
            <Text className="text-center #151414 text-3xl font-semibold mb-5">Enter the email associated with your account</Text>
            <Text className="text-[16px] text-[#8F8D8E] font-medium">We will send you a link to reset your password</Text>
            
            <View className="items-start">
                <Text className="mb-1 font-medium text-black mt-10 px-4 text-left">Email:</Text>
                <TextInput className="px-4 w-300 h-10 bg-[#D9D9D9] rounded-[90px]"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address">
                </TextInput>
            </View>

            <TouchableOpacity
                className="mt-5 mb-5 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center"
                onPress={emailRequest}>
                <Text className="text-white text-[15px]">Submit</Text>
            </TouchableOpacity>

            <Link href="/login">Return to Login</Link>
        </View>
    )
}

export default ForgotPassword