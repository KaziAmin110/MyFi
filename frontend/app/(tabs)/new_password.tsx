import {ScrollView, TextInput,TouchableOpacity, Text, View, Button } from "react-native";
import { Link } from "expo-router";
import React, { useState } from 'react'
import { Image } from "react-native";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";


const NewPassword = () => {
    const [password, setPassword] = useState("");
    const[confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Track password visibility
    const[showConfirmPassword, setShowConfirmPassword] = useState(false); // Track confirmed passwoord visibility
    
    //Password must be at least 7 characters, including a number and special character
    const checkNewPassword = (password: string) =>{
        return(
            password.length >= 7 &&
            /\d/.test(password) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(password)
        );
    }

    const isPasswordValid = checkNewPassword(password);

    const doPasswordsMatch = 
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;

    const { token } = useLocalSearchParams<{ token?: string }>();
    

    const newPasswordRequest = async() => {
        if(!isPasswordValid || !doPasswordsMatch)
            return;

        console.log("Reset token:", token);
        try{
            const response = await fetch("http://localhost:5500/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset_token: token, new_password: password }),
            });

        const data = await response.json();

        if(response.ok)
        {
            alert("Password reset successful.");
            router.push("/login");
        }
        else
            alert(data.message || "Failed to reset password.");
        }catch(error){
            if(error instanceof Error)
                alert("Error: " + error.message);
            else
                alert("An unknown error occurred.");
        }
    }

    return(
        <View className="flex-1 justify-center bg-[#F1F2F4] px-6">
            <Text className="text-center #151414 text-3xl font-semibold mb-5">Create a new password</Text>
            
            <View className="mt-10"></View>
            
            <Text className="mb-1 font-medium text-black">New Password</Text>
            <View className="flex-row items-center px-4 mb-4 bg-light rounded-xl">
            <TextInput
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none" // prevent capitalization of the first letter
                placeholder="Enter new password"
                placeholderTextColor="#BABABA"
                className="flex-1"
            />
            {password.length > 0 && !isPasswordValid && (
            <Text className="text-red-500 text-sm mt-2">
                Password must be at least 7 characters and include a number and a special character
            </Text>)}

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image
                    source={
                        showPassword
                            ? require("../../assets/images/eye-off.png")
                            : require("../../assets/images/eye.png")
                    }
                    className="w-5 h-5"
                    resizeMode="contain"
                />
            </TouchableOpacity>

            </View>
                    
                <Text className="text-left mb-1 font-medium text-black">Confirm Password</Text>
                <View className="flex-row items-center px-4 mb-4 bg-light rounded-xl">
                <TextInput
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none" // prevent capitalization of the first letter
                    placeholder="Confirm your password"
                    placeholderTextColor="#BABABA"
                    className="flex-1"
                />
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                <Text className="text-red-500 text-sm mt-2">
                Password must match in both fields
                </Text>)}
                
            
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Image
                    source={
                        showConfirmPassword
                        ? require("../../assets/images/eye-off.png")
                        : require("../../assets/images/eye.png")
                    }
                    className="w-5 h-5"
                    resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>

            <View className="flex-start items-center">
                <TouchableOpacity
                    disabled={!isPasswordValid && !doPasswordsMatch}
                    className="mt-8 w-40 h-10 bg-[#2E4D80] p-4 rounded-[90px] justify-center items-center"
                    onPress={newPasswordRequest}>
                    <Text className="text-white text-[15px]">Confirm</Text>
                </TouchableOpacity>
            
                <Link href="/login">Return to Login</Link>
            </View>
            
        </View>
    )
}

export default NewPassword