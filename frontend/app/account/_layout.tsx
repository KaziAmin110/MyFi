import { Text, View } from "react-native";
import React from 'react'
import { Tabs } from "expo-router";

const _Layout = () => {
    return (
        <Tabs>
            <Tabs.Screen
                name="dashboard"
                options={{ 
                    title: "Home",
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{ 
                    title: "Chat",
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="assessment"
                options={{ 
                    title: "Assessment",
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false
                }}
            />
        </Tabs>
    )
}
export default _Layout