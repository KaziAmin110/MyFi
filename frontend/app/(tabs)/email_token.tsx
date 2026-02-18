import {TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React, { useState } from "react";
import OTPTextInput from "react-native-otp-textinput";
import { router } from "expo-router";


const EmailToken = () => {
    const[token, setToken] = useState("");

    const checkToken = (token:string) => {
        const tokenPattern = /^[A-Za-z0-9]{6}$/;
        //const cleanToken = token.replace(/\s/g, "");
        if(!tokenPattern.test(token))
        {
            alert("Please enter a 6 digit code.");
            return false;
        }
        return true;
    }

    const codeRequest = async() => {
        const cleanToken = token.replace(/\s/g, "").toUpperCase();

        if(!checkToken(cleanToken))
            return;

        try{
                    const response = await fetch("http://localhost:5500/api/auth/verify-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reset_token: cleanToken }),
                    });
        
                    const data = await response.json();
        
                    if(response.ok)
                    {
                        alert("The token is verified.");
                        router.push({
                            pathname: "/new_password",
                            params: {token: cleanToken, },
                        });
                    }
                    else
                        alert(data.message || "Error verifying the token.");
                }catch(error){
                    if(error instanceof Error)
                        alert("Error: " + error.message);
                    else
                        alert("An unknown error occurred.");
                }
    }

    return(
        <View className="flex-1 items-center justify-center bg-[#F1F2F4]]">
            <Text className="text-center #151414 text-3xl font-semibold mb-5">Please enter the 6-digit token sent to your email</Text>
            
            <View className="mt-10">
                <OTPTextInput
                inputCount={6}
                handleTextChange={setToken}
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
                className="mt-8 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center"
                onPress={codeRequest}>
                <Text className="text-white text-[15px]">Verify</Text>
            </TouchableOpacity>

            <Link href="/login">Return to Login</Link>
        </View>
    )
}

export default EmailToken