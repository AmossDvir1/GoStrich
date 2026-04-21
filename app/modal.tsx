import { Link } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-5">
      <Text className="text-2xl font-bold text-slate-900">Modal</Text>
      <Link href="/" dismissTo className="mt-4 py-4">
        <Text className="text-base text-primary">Go to home screen</Text>
      </Link>
    </View>
  );
}
