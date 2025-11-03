import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="(tabs)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(tabs)/register"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(tabs)/login"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  )
}