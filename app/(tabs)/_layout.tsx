import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* ensure the gesture root fills the screen */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
              headerShown: false,
              tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="laps"
              options={{
                title: 'Laps',
                //use car-off icon if client is disconnected
                tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car-connected" size={24} color={color} />,
              }}
            />
            <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({color}) => <MaterialCommunityIcons name="car-settings" size={24} color={color} />
            }}
            />
          </Tabs>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}