import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function LapsLayout() {
  const colorScheme = useColorScheme();
  const textStyle = { color: colorScheme === 'dark' ? 'white' : 'black' };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
        headerTransparent: true,
        headerTintColor: textStyle.color,
        headerBlurEffect: 'none',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Aufgezeichnete Runden',
        }}
      />
    </Stack>
  );
}