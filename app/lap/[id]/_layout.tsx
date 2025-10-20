// app/(tabs)/laps/_layout.tsx

import { Stack } from 'expo-router';

export default function LapsStackLayout() {
  return (
    <Stack>
      {/* The 'index' screen is the main list page (app/(tabs)/laps/index.tsx)
        This is where the native header/back button is established.
      */}
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Aufgezeichnete Runden', 
          headerLargeTitle: true,
          // You can also hide the header here if you rely on the detail page to show one
        }} 
      />
    </Stack>
  );
}