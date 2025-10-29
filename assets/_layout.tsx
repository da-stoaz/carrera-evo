import { Stack, useLocalSearchParams } from 'expo-router';

export default function LapLayout() {
  const { id } = useLocalSearchParams();
  const lapId = typeof id === 'string' ? parseInt(id, 10) : 0; // Ensure id is handled safely

  return (
    <Stack
      // Setting common screen options here, but title must be applied to the screen itself
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' }, 
        headerTintColor: '#fefefe',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTransparent: true, 
        // Optional: Apply the liquid glass blur effect on iOS
        // @ts-ignore
        headerBlurEffect: "systemChromeMaterial",
      }}
    >
      <Stack.Screen
        name="[id]/index" // Targets the lap details page (lap/[id]/index.tsx)
        options={{
          // Now the back button custom name and title will work correctly
          title: `Rundendetails ${lapId}`,
          headerBackTitle: 'Laps', // Works on iOS
          headerBackTitleStyle: { fontSize: 16 }, // Adjusted for standard size
        }}
      />
    </Stack>
  );
}
