import { LapsProvider } from '@/context/LapsContext';
import { RecorderProvider } from '@/context/RecorderContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        // <React.StrictMode>
        <LapsProvider>
            <RecorderProvider>
                <SafeAreaProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <Stack screenOptions={{
                                headerStyle: { backgroundColor: 'transparent' },
                                headerTintColor: '#fefefe',
                                headerTitleStyle: { fontWeight: 'bold' },
                                headerTransparent: true,
                                headerBlurEffect: "none",
                            }}>
                                <Stack.Screen name="(tabs)" options={{
                                    headerShown: false
                                }} />
                                <Stack.Screen
                                    name="lap/[id]/index"
                                    options={{
                                        title: 'Rundendetails ', // Dynamic title is best set inside the screen using useLayoutEffect
                                        headerBackTitle: 'Laps',
                                        headerStyle: { backgroundColor: 'transparent', },
                                        headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
                                        headerTransparent: true,
                                        headerTintColor: '#fefefe',
                                        headerBlurEffect: "none",
                                    }}
                                />
                                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                            </Stack>
                            {/* Setting StatusBar style to reflect the dark background of the detail page */}
                            <StatusBar style="auto" />
                        </GestureHandlerRootView>
                    </ThemeProvider>
                </SafeAreaProvider>
            </RecorderProvider>
        </LapsProvider>
        // </React.StrictMode>
    );
}
