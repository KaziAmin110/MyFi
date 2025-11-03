import { Link } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";
import { Text, View, Button } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Welcome to MyFi!</Text>
      
      <Button
        onPress={() => navigate("/register")}
        title="Create account"
        color="#345995"
      />

      <Link href="/login">Already a member? Log in</Link>
    </View>
  );
}
