import { publishThrottle } from "@/lib/mqttClient";
import { Lap, ThrottleDataPoint } from "@/types/types";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import * as Progress from 'react-native-progress';
import { SafeAreaView } from "react-native-safe-area-context";


function calculateAverageGas(throttleData: ThrottleDataPoint[]): string {
  if (!throttleData || !throttleData.length) return '0.0';
  const sum = throttleData.reduce((acc, { v: value }) => acc + value, 0);
  return (sum / throttleData.length).toFixed(1);
}

function calculateLapTime(throttleData: ThrottleDataPoint[]): string {
  if (!throttleData || !throttleData.length) return '0.00';
  const start = throttleData[0].t;
  const end = throttleData[throttleData.length - 1].t;
  // Assuming time in ms, convert to seconds
  return ((end - start) / 1000).toFixed(2);
}


export default function LapDetails({ lap }: { lap: Lap }) {
    const [isReplaying, setIsReplaying] = useState(false);
    const [loop, setLoop] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const currentIndexRef = useRef(0);

    const throttleData = lap.throttleData;

    const startReplay = () => {
        if (!throttleData.length) return;

        setIsReplaying(true);
        setProgress(0);
        currentIndexRef.current = 0;

        const playStep = () => {
            if (currentIndexRef.current >= throttleData.length) {
                if (loop) {
                    currentIndexRef.current = 0;
                    setProgress(0);
                } else {
                    stopReplay();
                    return;
                }
            }

            const point = throttleData[currentIndexRef.current];
            publishThrottle(point.v);
            setProgress(currentIndexRef.current / throttleData.length);

            currentIndexRef.current++;
            const nextDelay = currentIndexRef.current < throttleData.length
                ? throttleData[currentIndexRef.current].t - point.t
                : 0;

            intervalRef.current = setTimeout(playStep, nextDelay);
        };

        playStep();
    };

    const stopReplay = () => {
        setIsReplaying(false);
        if (intervalRef.current) {
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
        }
        setProgress(0);
    };

    useEffect(() => {
        return () => stopReplay(); // Cleanup on unmount
    }, []);

    //const downsampledData = lttb(throttleData, 500).map(p => ({ value: p.v, label: ((p.t - throttleData[0].t) / 1000).toFixed(2) }));

    return (
        <SafeAreaView style={styles.detailsContainer}>
            <Text style={styles.modalTitle}>Rundendetails</Text>
            <Text>Durchschnittliche Gasposition: {calculateAverageGas(throttleData)}%</Text>
            <Text>Timestamp der Aufzeichnung: {new Date(lap.date).toLocaleString('de-DE')}</Text>
            <Text>Rundenzeit: {lap.lapTime !== undefined ? lap.lapTime.toFixed(2) : calculateLapTime(throttleData)}s</Text>

            {/* <View style={styles.chartContainer}>
                <LineChart
                    {...({
                        data: downsampledData,
                        width: 300,
                        height: 200,
                        yAxisProps: { minValue: 0, maxValue: 100 },
                        color: 'blue',
                        thickness: 2,
                        curved: true,
                    } as any)}
                />
            </View> */}

            <View style={styles.replayContainer}>
                <Text>Loop:</Text>
                <Switch value={loop} onValueChange={setLoop} />
                {!isReplaying ? (
                    <TouchableOpacity style={styles.replayButton} onPress={startReplay}>
                        <Text style={styles.buttonText}>Abspielen</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.cancelButton} onPress={stopReplay}>
                        <Text style={styles.buttonText}>Abbrechen</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isReplaying && (
                <Progress.Bar progress={progress} width={300} color="green" />
            )}


        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    detailsContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    chartContainer: {
        marginVertical: 20,
    },
    replayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    replayButton: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 8,
        marginLeft: 16,
    },
    cancelButton: {
        backgroundColor: 'red',
        padding: 12,
        borderRadius: 8,
        marginLeft: 16,
    },
    modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
})