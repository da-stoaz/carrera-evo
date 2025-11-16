import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const textStyle = { color: colorScheme === 'dark' ? 'white' : 'black' };
  const liquidGlass: boolean = Platform.OS === "ios" && parseInt(Platform.Version.split(".")[0], 10) >= 26;
  console.log("Use liquid glass?", liquidGlass);

  return (
    <>
      {liquidGlass ? (
        <NativeTabs
          labelStyle={{ color: "#ff0000" }}
          tintColor="#ff0000"
        >
          <NativeTabs.Trigger name="drive">
            <Label>Drive</Label>
            <Icon sf="speedometer" drawable='custom_android_drawable' /> {/* Adjusted SF symbol to match theme; use 'house.fill' if preferred */}
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="laps">
            <Label>Laps</Label>
            <Icon sf="timer" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
            <Label>Settings</Label>
            <Icon sf="gear" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ) : (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: 'red',
            tabBarStyle: {}, // Keep your custom styles if any
            headerTransparent: true,
            headerTintColor: textStyle.color,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              href: null, // Hides the tab bar item
            }}
          />
          <Tabs.Screen
            name="drive"
            options={{
              headerShown: false, // Hide Tabs header; use nested Stack instead
              tabBarLabel: "Drive",
              tabBarIcon: ({ color }) => <Ionicons name="speedometer-outline" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="laps"
            options={{
              headerShown: false, // Hide Tabs header
              tabBarLabel: "Laps",
              tabBarIcon: ({ color }) => <Ionicons name="timer" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              headerShown: false, // Hide Tabs header
              tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
            }}
          />
        </Tabs>
      )}
    </>
  );
}