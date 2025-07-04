import { View, Text, TextInput } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold mb-4">Login</Text>
      <TextInput placeholder="Email" className="border px-4 py-2 w-3/4 mb-2 rounded" />
      <TextInput placeholder="Password" secureTextEntry className="border px-4 py-2 w-3/4 rounded" />
    </View>
  );
}
