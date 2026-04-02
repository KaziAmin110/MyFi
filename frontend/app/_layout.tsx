import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import './globals.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false}}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation:"fade" }}
        />

        <Stack.Screen
          name="takeAssessment"
          options={{ headerShown: false, gestureEnabled: false }}
        />

        <Stack.Screen
          name="account"
          options={{ headerShown: false}}
        />
      </Stack>
    </SafeAreaProvider>
  )
}