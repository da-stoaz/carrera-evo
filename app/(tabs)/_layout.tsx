// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabLayout() {

  const colorScheme = useColorScheme();

  const textStyle = {
    color: colorScheme === 'dark' ? 'white' : 'black',
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'red',
        headerStyle: { backgroundColor: 'transparent', },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
        tabBarStyle: {

        },
        headerTransparent: true,
        headerTintColor: textStyle.color,
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: 'Carrera Throttle Control',
          tabBarLabel: "Drive",
          headerTintColor: '#fefefe',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="laps"
        options={{
          title: 'Aufgezeichnete Runden',
          tabBarLabel: "Laps",
          headerTintColor: '#fefefe',
          tabBarIcon: ({ color }) => <Ionicons name="timer" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}