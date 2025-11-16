import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureStateChangeEvent, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from "react-native-worklets";

// Define the dimensions and range
const SLIDER_HEIGHT = Dimensions.get('window').height * 0.6; // 60% of screen height
const THROTTLE_MIN = 0;
const THROTTLE_MAX = 100;
const THUMB_SIZE = 80;
const THUMB_RADIUS = THUMB_SIZE / 2;

type Props = {
    onThrottleChange: (throttle: number) => void;
};


export default function ThrottleControl({ onThrottleChange }: Props) {
    const positionY = useSharedValue(SLIDER_HEIGHT - THUMB_RADIUS);
    const startY = useSharedValue(0);
    const lastValue = useSharedValue(-1);

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

            // Compute throttle and round to 1 decimal
            const value = Math.round(getThrottleValue(positionY.value) * 10) / 10;

            // Only call onThrottleChange if it actually changed
            if (value !== lastValue.value) {
                lastValue.value = value;
                scheduleOnRN(onThrottleChange, value);
            }
        })
        .onEnd(() => {
            'worklet';
            // Release to set back to 0
            positionY.value = SLIDER_HEIGHT - THUMB_RADIUS; // Visual snap back to the bottom (0%)

            // Send 0% command on the JS thread
            scheduleOnRN(onThrottleChange, THROTTLE_MIN);
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

        <View style={styles.sliderContainer}>
            {/* Track Fill */}
            <Animated.View style={[styles.trackFill, trackFillStyle]} />

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.thumb, thumbStyle]} />
            </GestureDetector>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    sliderContainer: {
        width: 80,
        height: SLIDER_HEIGHT,
        backgroundColor: '#ccc',
        borderRadius: 40,
        justifyContent: 'flex-start',
        alignItems: 'center',
        // Removed overflow: 'hidden' to allow texts to be visible outside the bounds
    },
    trackFill: {
        position: 'absolute',
        width: 80,
        backgroundColor: 'red',
        borderRadius: 40,
        borderColor: '#e53935',
        borderWidth: 2,
        shadowColor: '#e53935',
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 6,
    },
    thumb: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        borderColor: '#e53935',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
});