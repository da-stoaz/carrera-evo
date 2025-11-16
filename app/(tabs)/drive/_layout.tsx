import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function DriveLayout() {
  const colorScheme = useColorScheme();
  const textStyle = { color: colorScheme === 'dark' ? 'white' : 'black' };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
        headerTransparent: true,
        headerTintColor: textStyle.color,
        headerBlurEffect: 'none', // Adjust if you want blur for liquid glass
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Carrera Throttle Control',
        }}
      />
    </Stack>
  );
}