// components/ReplayLap.tsx
import { publishThrottle } from '@/lib/mqttClient';
import type { ThrottleDataPoint } from '@/types/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';

interface ReplayLapProps {
    throttleData: ThrottleDataPoint[];
}

export default function ReplayLap({ throttleData }: ReplayLapProps) {
    const [isReplaying, setIsReplaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loop, setLoop] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ← Fixed type
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // ← Fixed type
    const startTimeRef = useRef(0);
    const currentIndexRef = useRef(0);
    const isReplayingRef = useRef(false);

    const stopReplay = useCallback(() => {
        isReplayingRef.current = false;
        setIsReplaying(false);
        setProgress(0);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const scheduleNext = useCallback((index: number) => {
        if (!isReplayingRef.current || index >= throttleData.length) {
            if (index >= throttleData.length && loop && isReplayingRef.current) {
                // Loop: Reset and continue
                currentIndexRef.current = 0;
                startTimeRef.current = performance.now();
                scheduleNext(0);
            } else {
                stopReplay();
            }
            return;
        }

        const baseTime = throttleData[0].t;
        const pointTime = throttleData[index].t - baseTime;
        const elapsed = performance.now() - startTimeRef.current;

        let delay = pointTime - elapsed;

        // If late or immediate, publish now and schedule next recursively (no timeout)
        if (delay <= 0) {
            publishThrottle(throttleData[index].v);
            currentIndexRef.current = index + 1;
            scheduleNext(index + 1);
            return;
        }

        // Cap delay to positive ms (setTimeout min ~4ms, but we use exact)
        delay = Math.max(1, delay); // Avoid 0ms which is async

        timeoutRef.current = setTimeout(() => {
            if (!isReplayingRef.current) return;

            publishThrottle(throttleData[index].v);
            currentIndexRef.current = index + 1;
            scheduleNext(index + 1);
        }, delay);
    }, [throttleData, loop, stopReplay]);

    const startReplay = useCallback(() => {
        if (throttleData.length === 0 || isReplayingRef.current) return;

        isReplayingRef.current = true;
        setIsReplaying(true);
        setProgress(0);

        currentIndexRef.current = 0;
        startTimeRef.current = performance.now();

        // Start scheduling
        scheduleNext(0);

        // Separate progress updater (every 50ms for smooth UI)
        const baseTime = throttleData[0].t;
        const totalDuration = throttleData[throttleData.length - 1].t - baseTime;

        intervalRef.current = setInterval(() => {
            if (!isReplayingRef.current) return;

            const elapsed = performance.now() - startTimeRef.current;
            const prog = Math.min(elapsed / totalDuration, 1);
            setProgress(prog);

            // If looped, progress will reset naturally on startTimeRef update
        }, 50);
    }, [throttleData, scheduleNext]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopReplay();
        };
    }, [stopReplay]);

    return (
        <View style={styles.replayContainer}>
            <View style={styles.loopContainer}>
                <Text style={styles.label}>Loop</Text>
                <Switch
                    value={loop}
                    onValueChange={setLoop}
                    thumbColor={loop ? "white" : "white"}
                    trackColor={{ false: "white", true: "red" }}
                    style={{ marginTop: 6 }}
                />
            </View>

            {!isReplaying ? (
                <TouchableOpacity style={styles.replayButton} onPress={startReplay} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Abspielen</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.cancelButton} onPress={stopReplay} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Abbrechen</Text>
                </TouchableOpacity>
            )}

            {isReplaying && (
                <Progress.Bar
                    progress={progress}
                    width={null}
                    color="#e53935"
                    borderRadius={10}
                    unfilledColor="rgba(255,255,255,0.3)"
                    borderWidth={0}
                    style={{ marginTop: 12 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    replayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10, marginBottom: 20
    },
    loopContainer: {
        alignItems: 'flex-start'
    },
    label: {
        fontSize: 18,
        color: '#fefefe',
        marginBottom: 8
    },
    replayButton: {
        backgroundColor: 'red',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        marginLeft: 16,
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButton: {
        backgroundColor: '#e53935',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        marginLeft: 16,
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#fefefe',
        fontWeight: '700',
        fontSize: 16
    },
});