import { Stack } from "expo-router";

const _Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot_password" options={{ headerShown: false }} />
      <Stack.Screen name="email_token" options={{ headerShown: false }} />
      <Stack.Screen name="new_password" options={{ headerShown: false }} />
    </Stack>
  );
};
export default _Layout;
