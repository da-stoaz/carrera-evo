import { publishThrottle } from '@/lib/mqttClient';
import { calculateAverageGas, calculateLapTime, lttb } from "@/lib/utils";
import { Lap, ThrottleDataPoint } from '@/types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LapDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const lapId = typeof id === 'string' ? parseInt(id, 10) : null;

  const [lap, setLap] = useState<Lap | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef(0);

  // Helper to re-create the sample logic
  const getSampleLaps = async () => {
    const throttlesample: ThrottleDataPoint[] = Array.from({ length: 10000 }, (_, i) => ({
      t: i,
      v: Math.round((Math.sin(i / 100) + 1) * 50)
    }));
    const laps: Lap[] = [
      { id: 1, date: new Date("2025-10-15").getTime(), throttleData: throttlesample },
      { id: 2, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(5000, 8888) },
      { id: 3, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(444, 9330) },
      { id: 4, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(3453, 10000) },
      { id: 5, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(100, 8004) }
    ];
    return JSON.stringify(laps);
  };

  // Load lap data based on the ID from the async storage (or sample data)
  useEffect(() => {
    if (lapId === null) return;

    const loadLap = async () => {
      try {
        const json = await AsyncStorage.getItem('laps');
        if (json) {
          const laps: Lap[] = JSON.parse(json);
          const selectedLap = laps.find(l => l.id === lapId);
          if (selectedLap) {
            setLap(selectedLap);
          } else {
            const sampleLapsJson = await getSampleLaps();
            const sampleLaps: Lap[] = JSON.parse(sampleLapsJson);
            const sampleLap = sampleLaps.find(l => l.id === lapId);
            if (sampleLap) {
              setLap(sampleLap);
            } else {
              router.back();
            }
          }
        }
      } catch (e) {
        console.error('Failed to load lap', e);
        router.back();
      }
    };
    loadLap();
  }, [lapId, router]);

  const stopReplay = () => {
    setIsReplaying(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  };

  const startReplay = () => {
    if (!lap || !lap.throttleData.length) return;

    setIsReplaying(true);
    setProgress(0);
    currentIndexRef.current = 0;
    const throttleData = lap.throttleData;

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

  useEffect(() => {
    return () => stopReplay(); // Cleanup on unmount/page exit
  }, []);


  if (!lap) {
    return (
      <SafeAreaView style={styles.detailsContainer}>
        <Text style={styles.modalTitle}>Lade Rundendetails...</Text>
      </SafeAreaView>
    );
  }

  const downsampledData = lttb(lap.throttleData, 500).map(p => ({ value: p.v, label: ((p.t - lap.throttleData[0].t) / 1000).toFixed(2) }));


  return (
    <SafeAreaView style={styles.detailsContainer}>
      <Stack.Screen
        options={{
          title: `Rundendetails ${lapId}`,
          headerBackTitle: 'Laps',
        }}
      />
      <Text style={styles.modalTitle}>Rundendetails</Text>
      <Text>Durchschnittliche Gasposition: {calculateAverageGas(lap.throttleData)}%</Text>
      <Text>Timestamp der Aufzeichnung: {new Date(lap.date).toLocaleString('de-DE')}</Text>
      <Text>Rundenzeit: {lap.lapTime !== undefined ? lap.lapTime.toFixed(2) : calculateLapTime(lap.throttleData)}s</Text>

      <View style={styles.chartContainer}>
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
      </View>

      <View style={styles.replayContainer}>
        <View style={
          {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row'
          }
        }>
          <Text>Loop:</Text>
          <Switch value={loop} onValueChange={setLoop} />
        </View>

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
  detailsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
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
  closeButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});