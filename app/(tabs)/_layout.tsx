import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={() => null}
    >
      <Tabs.Screen name="index" options={{ title: "Run" }} />
      <Tabs.Screen name="history" options={{ title: "Sessions" }} />
    </Tabs>
  );
}
