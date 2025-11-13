import { Images } from '@/assets';
import RecordingIndicator from '@/components/RecordingIndicator';
import ThrottleControl from '@/components/throttle-control';
import { useRecorder } from '@/context/RecorderContext';

import { disconnectMqtt, initMqtt, publishThrottle, subscribeTopic } from '@/lib/mqttClient';
import { useEffect, useState } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function handleLightGateTriggered(payload: string) {
    console.log(`Status update received: ${payload}`);
}

export default function DriveScreen() {
    const { isRecording, data, start, stop, addThrottlePoint, save } = useRecorder();
    const [throttleValue, setThrottleValue] = useState(0);

    // TODO: In the future, replace this calculation with real voltage data subscribed from the MQTT broker
    const voltage = (throttleValue / 100) * 15;

    const insets = useSafeAreaInsets(); // Get safe area insets

    const toggleRecording = async () => {
        if (isRecording) {
            const recordedDataPoints = stop();
            console.log('Lap finished –', JSON.stringify(recordedDataPoints, null, 2));
            const savedLap = await save();
            console.log('Saved lap ID:', savedLap.id);
        } else {
            start();
        }
    };

    useEffect(() => {
        initMqtt();
        subscribeTopic('lightgate', handleLightGateTriggered);

        // Cleanup on unmount
        return () => {
            disconnectMqtt();
        };
    }, []);

    // Calculate additional top padding for header height + extra space
    const additionalTopPadding = (Platform.OS === 'ios' ? 44 : 56) + 20;

    return (
        <ImageBackground
            source={Images.raceTrack}
            style={styles.background}
            blurRadius={40}
        >
            <View style={styles.overlay} />
            <SafeAreaView style={{ flex: 1 }}>
                <View
                    style={[
                        styles.container,
                        {
                            paddingTop: additionalTopPadding,
                            // Optional: Log insets for debugging
                            // console.log('Insets:', insets);
                        },
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.recordButton}
                        onPress={toggleRecording}
                    >
                        <Text style={styles.recordButtonText}>
                            {!isRecording ? "Runde Aufzeichnen" : "Aufzeichnung beenden"}
                        </Text>
                    </TouchableOpacity>
                    <RecordingIndicator />

                    <View style={styles.throttleContainer}>
                        <Text style={styles.valueText}>{throttleValue !== 100 ? throttleValue.toFixed(1) : throttleValue}%</Text>
                        <ThrottleControl
                            onThrottleChange={(throttle) => {
                                setThrottleValue(throttle);
                                console.log(throttle);
                                publishThrottle(throttle);
                                if (isRecording) addThrottlePoint(throttle);
                            }}
                        />
                        <Text style={styles.voltageText}>{voltage.toFixed(1)}V</Text>
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    recordButton: {
        backgroundColor: '#e53935',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: 'center',
        minWidth: 150,
        elevation: 3,
    },
    throttleContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: 'center',
        gap: 10
    },
    recordButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    valueText: {
        flex: 1,
        textAlign: "right",
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    voltageText: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});