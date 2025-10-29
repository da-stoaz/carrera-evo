import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: true }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        {/* CRITICAL FIX: Reverting to explicit definition of lap/[id] to ensure the 
                          header and back button work correctly when navigating from the tabs.
                          
                          NOTE: To avoid the DUAL HEADER issue, you MUST delete or empty your 
                          'app/lap/_layout.tsx' file. This is now the only file defining the lap header.
                        */}
                        <Stack.Screen
                            name="lap/[id]/index"
                            options={{
                                title: 'Rundendetails ', // Dynamic title is best set inside the screen using useLayoutEffect
                                headerBackTitle: 'Laps',
                                headerStyle: { backgroundColor: 'transparent' },
                                headerTitleStyle: { fontWeight: 'bold' },
                                headerTransparent: true,
                                headerTintColor: '#fefefe', 
                                headerBlurEffect: "none",
                            }}
                        />
                        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                    </Stack>
                    {/* Setting StatusBar style to reflect the dark background of the detail page */}
                    <StatusBar style="light" />
                </GestureHandlerRootView>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
