import { publishThrottle } from '@/lib/mqttClient';
import { calculateAverageGas, calculateLapTime, lttb } from "@/lib/utils";
import { Lap } from '@/types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';

const backgroundImage = { uri: 'https://wallpapers.com/images/hd/race-track-pictures-w4p4u0usrxl8bqii.jpg' };

export default function LapDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const lapId = typeof id === 'string' ? parseInt(id, 10) : null;

  const [lap, setLap] = useState<Lap | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const currentIndexRef = useRef(0);

  // Load lap data based on the ID from the async storage (or sample data)
  useEffect(() => {
    if (lapId === null || isNaN(lapId)) {
      router.back(); // Invalid ID, go back early
      return;
    }

    const loadLap = async () => {
      try {
        const json = await AsyncStorage.getItem('laps');
        if (json) {
          const laps: Lap[] = JSON.parse(json);
          const selectedLap = laps.find(l => l.id === lapId);
          if (selectedLap) {
            setLap(selectedLap);
          } else {
            router.back();
          }
        } else {
          router.back();
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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
  };

  const startReplay = () => {
    if (!lap || !lap.throttleData.length) return;

    setIsReplaying(true);
    setProgress(0);
    currentIndexRef.current = 0;
    startTimeRef.current = performance.now();
    const throttleData = lap.throttleData;
    const baseTime = throttleData[0].t;

    const playStep = (timestamp: number) => {
      if (!isReplaying) return;

      const elapsed = timestamp - startTimeRef.current;

      while (currentIndexRef.current < throttleData.length && (throttleData[currentIndexRef.current].t - baseTime) <= elapsed) {
        const point = throttleData[currentIndexRef.current];
        publishThrottle(point.v);
        currentIndexRef.current++;
      }

      setProgress(currentIndexRef.current / throttleData.length);

      if (currentIndexRef.current >= throttleData.length) {
        if (loop) {
          currentIndexRef.current = 0;
          startTimeRef.current = performance.now();
          rafRef.current = requestAnimationFrame(playStep);
        } else {
          stopReplay();
        }
      } else {
        rafRef.current = requestAnimationFrame(playStep);
      }
    };

    rafRef.current = requestAnimationFrame(playStep);
  };

  useEffect(() => {
    return () => stopReplay(); // Cleanup on unmount/page exit
  }, []);


  if (!lap) {
    return (
      <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={5}>
        <View style={styles.overlay} />
        <SafeAreaView style={[styles.detailsContainer, styles.glassContainer]}>
          <Text style={styles.modalTitle}>Lade Rundendetails...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const downsampledData = lttb(lap.throttleData, 100).map(p => ({ value: p.v, label: p.t.toString() }));

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={5}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.detailsContainer, styles.glassContainer]}>
          <Text style={styles.modalTitle}>Rundendetails</Text>
          <Text style={styles.label}>Durchschnittliche Gasposition: <Text style={styles.value}>{calculateAverageGas(lap.throttleData)}%</Text></Text>
          <Text style={styles.label}>Timestamp der Aufzeichnung: <Text style={styles.value}>{new Date(lap.date).toLocaleString('de-DE')}</Text></Text>
          <Text style={styles.label}>Rundenzeit: <Text style={styles.value}>{lap.lapTime !== undefined ? lap.lapTime.toFixed(2) : calculateLapTime(lap.throttleData)}s</Text></Text>

          <View style={[styles.chartContainer, styles.glassBlur]}>
            <LineChart
              data={downsampledData}
              maxValue={100}
              height={250}
              width={Dimensions.get('window').width}
              color={"white"}
              thickness={3}
              curved={true}
              backgroundColor="transparent"
              hideRules={true}
              hideAxesAndRules={true}
              yAxisColor="transparent"
              xAxisColor="transparent"
            />
          </View>

          <View style={[styles.replayContainer]}>
            <View style={styles.loopContainer}>
              <View style={{ flexDirection: 'column' }}>
                <Text style={styles.label}>Loop</Text>
                <Switch value={loop} onValueChange={setLoop} thumbColor={loop ? "white" : "white"} trackColor={{ false: "white", true: "red" }} style={{ marginTop: 6 }} />
              </View>
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
          </View>

          {isReplaying && (
            <Progress.Bar progress={progress} width={Dimensions.get('window').width - 40} color="#e53935" borderRadius={10} unfilledColor="rgba(255,255,255,0.3)" borderWidth={0} />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsContainer: {
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
  },
  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  glassBlur: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    marginVertical: 20,
    padding: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fefefe',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#fefefe',
    marginBottom: 8,
  },
  value: {
    fontWeight: '600',
  },
  chartContainer: {
    alignSelf: 'center',
    width: "115%",
    overflow: "hidden"
  },
  replayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  loopContainer: {
    alignItems: 'flex-start',
  },
  replayButton: {
    backgroundColor: 'red',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginLeft: 16,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e53935',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginLeft: 16,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fefefe',
    fontWeight: '700',
    fontSize: 16,
  },
});