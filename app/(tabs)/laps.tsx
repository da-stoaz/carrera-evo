// app/(tabs)/laps.tsx
import { publishThrottle } from '@/lib/mqttClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Type Definitions ---

/**
 * Represents a single throttle data point recorded during a lap.
 */
interface ThrottleDataPoint {
  t: number; // Timestamp in milliseconds (e.g., from Date.now())
  v: number; // Throttle value, likely 0-100%
}

/**
 * Represents a single recorded lap.
 */
interface Lap {
  id: number; // Unique identifier for the lap
  date: number; // Timestamp of when the lap was recorded (e.g., from Date.now())
  throttleData: ThrottleDataPoint[];
  lapTime?: number; // Optional pre-calculated lap time in seconds
}

interface Point {
  x: number;
  y: number;
}

function lttb(data: ThrottleDataPoint[], threshold: number): ThrottleDataPoint[] {
  const dataLength = data.length;
  if (threshold >= dataLength || threshold === 0) {
    return data; // No downsampling needed
  }

  const sampled: ThrottleDataPoint[] = [];
  let sampledIndex = 0;
  const bucketSize = (dataLength - 2) / (threshold - 2);
  let a = 0; // Start point
  let nextA = 0;

  sampled[sampledIndex++] = data[a]; // Add the first point

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += data[avgRangeStart].t;
      avgY += data[avgRangeStart].v;
    }

    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    let rangeOffs = Math.floor((i + 0) * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;
    const pointAX = data[a].t;
    const pointAY = data[a].v;

    let maxArea = -1;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[rangeOffs].v - pointAY) -
        (pointAX - data[rangeOffs].t) * (avgY - pointAY)
      );
      if (area > maxArea) {
        maxArea = area;
        nextA = rangeOffs;
      }
    }

    sampled[sampledIndex++] = data[nextA]; // Add the most important point
    a = nextA;
  }

  sampled[sampledIndex++] = data[dataLength - 1]; // Add the last point

  return sampled;
}

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

function LapDetails({ lap, onClose }: { lap: Lap; onClose: () => void }) {
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

  const downsampledData = lttb(throttleData, 500).map(p => ({value: p.v, label: ((p.t - throttleData[0].t) / 1000).toFixed(2)}));

  return (
    <SafeAreaView style={styles.detailsContainer}>
      <Text style={styles.modalTitle}>Rundendetails</Text>
      <Text>Durchschnittliche Gasposition: {calculateAverageGas(throttleData)}%</Text>
      <Text>Timestamp der Aufzeichnung: {new Date(lap.date).toLocaleString('de-DE')}</Text>
      <Text>Rundenzeit: {lap.lapTime !== undefined ? lap.lapTime.toFixed(2) : calculateLapTime(throttleData)}s</Text>

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

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Schließen</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function LapsScreen() {
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);

  useEffect(() => {
    loadLaps();
  }, []);

  const loadLaps = async () => {
    const throttlesample = Array.from({ length: 10000 }, (_, i) => ({
      t: i, // unique ascending value
      // v oscillates smoothly between 0 and 100 using a sine wave pattern
      v: Math.round((Math.sin(i / 100) + 1) * 50)
    }));
    try {

      const json = await AsyncStorage.getItem('laps');
      if (json && JSON.parse(json).length > 0) {
        console.log(json)
        let laps = JSON.parse(json);
        setLaps(laps as Lap[]);
      } else {
        const laps = [
          {
            id: 1,
            date: new Date("2025-10-15").getTime(),
            throttleData: throttlesample
          },
          {
            id: 2,
            date: new Date("2025-10-15").getTime(),
            throttleData: throttlesample.slice(5000, 8888)
          },

          {
            id: 3,
            date: new Date("2025-10-15").getTime(),
            throttleData: throttlesample.slice(444, 9330)
          },
          {
            id: 4,
            date: new Date("2025-10-15").getTime(),
            throttleData: throttlesample.slice(3453, 10000)
          },
          {
            id: 5,
            date: new Date("2025-10-15").getTime(),
            throttleData: throttlesample.slice(100, 8004)
          }

        ]
        setLaps(laps);

      }
    } catch (e) {
      console.error('Failed to load laps', e);
    }
  };

  const saveLaps = async (newLaps: Lap[]) => {
    try {
      await AsyncStorage.setItem('laps', JSON.stringify(newLaps));
    } catch (e) {
      console.error('Failed to save laps', e);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Löschen', 'Sind Sie sicher?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', onPress: () => {
          const newLaps = laps.filter((lap) => lap.id !== id);
          setLaps(newLaps);
          saveLaps(newLaps);
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Lap }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => setSelectedLap(item)}>
      <View style={styles.infoContainer}>
        <Text style={styles.listText}>
          Rundenzeit: {item.lapTime !== undefined ? item.lapTime.toFixed(2) : calculateLapTime(item.throttleData)}s
        </Text>
        <Text style={styles.listText}>
          Datum: {new Date(item.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={(e) => {
        e.stopPropagation(); // Prevent opening details
        handleDelete(item.id);
      }}>
        <Text style={styles.buttonText}>Löschen</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Aufgezeichnete Runden</Text>
        <FlatList<Lap>
          data={laps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>Keine Runden aufgezeichnet.</Text>}
        />
        <Modal
          visible={!!selectedLap}
          animationType="slide"
          onRequestClose={() => setSelectedLap(null)}
        >
          {selectedLap && <LapDetails lap={selectedLap} onClose={() => setSelectedLap(null)} />}
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
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
});