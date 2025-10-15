import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureStateChangeEvent, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

// Define the dimensions and range
const SLIDER_HEIGHT = Dimensions.get('window').height * 0.6; // 60% of screen height
const THROTTLE_MIN = 0;
const THROTTLE_MAX = 100;
const THUMB_SIZE = 80;
const THUMB_RADIUS = THUMB_SIZE / 2;

export default function ThrottleControl() {
    const positionY = useSharedValue(SLIDER_HEIGHT - THUMB_RADIUS);
    const startY = useSharedValue(0);
    const [throttleValue, setThrottleValue] = useState(0);

    const getThrottleValue = (yPosition: number) => {
        'worklet'; // Mark as worklet
        // The slider is inverted: Y=SLIDER_HEIGHT is 0%, Y=0 is 100%
        return interpolate(
            yPosition,
            [SLIDER_HEIGHT - THUMB_RADIUS, THUMB_RADIUS],
            [THROTTLE_MIN, THROTTLE_MAX],
            Extrapolation.CLAMP // Use enum instead of string
        );
    };

    const publishThrottle = (value: number) => {
        const roundedValue = Math.round(value * 10) / 10;
        if (value !== throttleValue) {
            console.log(`Throttle: ${roundedValue.toFixed(1)}%`); // Fix template string
            //send only if changed
            // Example: sendDataToCar(roundedValue);
        }
        setThrottleValue(roundedValue);

    };

    // Define the Gesture using the builder
    const panGesture = Gesture.Pan()
        .onStart((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
            'worklet';
            startY.value = positionY.value;
        })
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            'worklet';
            // Calculate the new raw Y position, clamping it within the slider bounds
            let newY = startY.value + event.translationY;
            newY = Math.max(THUMB_RADIUS, Math.min(newY, SLIDER_HEIGHT - THUMB_RADIUS));

            // Update the visual position of the thumb
            positionY.value = newY;

            // Calculate throttle percentage and publish it
            const value = getThrottleValue(positionY.value);
            runOnJS(publishThrottle)(value);
        })
        .onEnd(() => {
            'worklet';
            // Release to set back to 0
            positionY.value = SLIDER_HEIGHT - THUMB_RADIUS; // Visual snap back to the bottom (0%)

            // Send 0% command on the JS thread
            runOnJS(publishThrottle)(THROTTLE_MIN);
        });

    // Animated styles
    const thumbStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: positionY.value - THUMB_RADIUS }],
        };
    });

    const trackFillStyle = useAnimatedStyle(() => {
        return {
            top: positionY.value - THUMB_RADIUS,
            height: SLIDER_HEIGHT - (positionY.value - THUMB_RADIUS),
        };
    });

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Carrera Throttle Control</Text>

            <View style={styles.sliderContainer}>
                {/* Track Fill */}
                <Animated.View style={[styles.trackFill, trackFillStyle]} />



                {/* Throttle Value Display */}
                <Text style={styles.valueText}>{throttleValue.toFixed(0)}%</Text>

                {/* Use GestureDetector and pass the built panGesture */}
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.thumb, thumbStyle]} />
                </GestureDetector>
            </View>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    sliderContainer: {
        width: 80,
        height: SLIDER_HEIGHT,
        backgroundColor: '#ccc',
        borderRadius: 40,
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden', // Add this to prevent thumb from sticking out
    },
    trackFill: {
        position: 'absolute',
        width: 80,
        backgroundColor: 'red',
        borderRadius: 40,
    },
    thumb: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        borderColor: '#333',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    valueText: {
        position: 'absolute',
        top: 20,
        left: 80,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
});