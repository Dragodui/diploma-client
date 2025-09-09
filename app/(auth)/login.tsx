import { useRouter } from "expo-router";
import { View, Text, TextInput, Button } from "react-native";

export default function Login() {
	const router = useRouter();

	return (
		<View className="flex-1 justify-center p-4">
			<Text  className="text-left text-[50px] font-black font-nunito mb-12">Login</Text>
			<View className="flex flex-col gap-3 justify-between items-center">
				<TextInput className="w-full border-[1px] border-gray-400 rounded-lg font-nunito font-medium text-xl p-3"  placeholder="Email" />
				<TextInput className="w-full border-[1px] border-gray-400 rounded-lg font-nunito font-medium text-xl p-3" placeholder="Password" />
				<Button title="Login" />
				<Text onPress={() => router.push("/(auth)/register")}>
					Don`t have and account? <Text>Register</Text>
				</Text>
			</View>
		</View>
	);
}
