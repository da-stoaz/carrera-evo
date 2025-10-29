// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'red',
        headerStyle: { backgroundColor: 'transparent', },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
        tabBarStyle: {

        },
        headerTransparent: true,
        headerTintColor: '#fefefe',
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: 'Carrera Throttle Control',
          tabBarLabel: "Drive",
          tabBarIcon: ({ color }) => <Ionicons name="speedometer-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="laps"
        options={{
          title: 'Aufgezeichnete Runden',
          tabBarLabel: "Laps",
          tabBarIcon: ({ color }) => <Ionicons name="timer" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          headerTintColor: '#000000',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}