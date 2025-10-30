import { Images } from '@/assets';
import { useLaps } from '@/hooks/useLaps'; // ← Import your custom hook
import { publishThrottle } from '@/lib/mqttClient';
import { calculateAverageGas, calculateLapTime } from "@/lib/utils";
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';
import LapChart from './LapChart';

export default function LapDetailsPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const lapId = typeof id === 'string' ? parseInt(id, 10) : null;

  const { laps, isLoading } = useLaps(); // ← Use custom hook

  const [isReplaying, setIsReplaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const currentIndexRef = useRef(0);
  const isReplayingRef = useRef(false);

  const setIsReplayingSafe = (value: boolean) => {
    isReplayingRef.current = value;
    setIsReplaying(value);
  };

  const headerHeight = useHeaderHeight();

  // Set header title
  useLayoutEffect(() => {
    if (lapId != null) {
      navigation.setOptions({ title: `Rundendetails ${lapId}` });
    }
  }, [navigation, lapId]);

  // Find the lap from the list provided by useLaps
  const lap = lapId != null ? laps.find(l => l.id === lapId) : null;

  // Handle invalid lap ID early
  useEffect(() => {
    if (lapId === null || isNaN(lapId)) {
      router.back();
    } else if (!isLoading && lap === undefined) {
      // Lap not found and data is loaded → go back
      router.back();
    }
  }, [lapId, lap, isLoading, router]);

  const stopReplay = useCallback(() => {
    isReplayingRef.current = false;
    setIsReplaying(false);
    setProgress(0);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    console.log('Replay stopped');
  }, []);

  const startReplay = useCallback(() => {
    if (!lap || !lap.throttleData.length || isReplayingRef.current) return;

    setIsReplayingSafe(true);
    setProgress(0);
    currentIndexRef.current = 0;
    startTimeRef.current = performance.now();
    rafRef.current = null;

    const throttleData = lap.throttleData;
    const baseTime = throttleData[0].t;
    const totalDuration = throttleData[throttleData.length - 1].t - baseTime;

    console.log(`Replay START: ${throttleData.length} pts over ${totalDuration}ms`);

    const playStep = (now: number) => {
      if (!isReplayingRef.current) return;

      const elapsedMs = now - startTimeRef.current;
      let published = 0;

      while (currentIndexRef.current < throttleData.length) {
        const point = throttleData[currentIndexRef.current];
        const pointTime = point.t - baseTime;
        if (pointTime > elapsedMs) break;

        publishThrottle(point.v);
        currentIndexRef.current++;
        published++;
      }

      const progress = Math.min(elapsedMs / totalDuration, 1);
      setProgress(progress);

      if (currentIndexRef.current >= throttleData.length) {
        console.log(`Replay FINISHED: ${published} sent this frame`);
        if (loop) {
          currentIndexRef.current = 0;
          startTimeRef.current = performance.now();
        } else {
          stopReplay();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(playStep);
    };

    rafRef.current = requestAnimationFrame(playStep);
  }, [lap, loop, stopReplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReplay();
    };
  }, [stopReplay]);

  // Loading state
  if (isLoading) {
    return (
      <ImageBackground source={Images.raceTrack} style={styles.background} resizeMode="cover" blurRadius={5}>
        <View style={styles.overlay} />
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: headerHeight }}>
          <View style={[styles.detailsContainer, styles.glassContainer]}>
            <Text style={styles.modalTitle}>Lade Rundendetails...</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Not found (after loading)
  if (!lap) {
    return (
      <ImageBackground source={Images.raceTrack} style={styles.background} resizeMode="cover" blurRadius={5}>
        <View style={styles.overlay} />
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: headerHeight }}>
          <View style={[styles.detailsContainer, styles.glassContainer]}>
            <Text style={styles.modalTitle}>Runde nicht gefunden</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={Images.raceTrack} style={styles.background} resizeMode="cover" blurRadius={5}>
      <View style={styles.overlay} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingHorizontal: 20,
        }}
        style={styles.fullScreenScroll}
      >
        <View style={[styles.detailsContainer, styles.glassContainer]}>
          <Text style={styles.label}>
            Durchschnittliche Gasposition: <Text style={styles.value}>{calculateAverageGas(lap.throttleData)}%</Text>
          </Text>
          <Text style={styles.label}>
            Datum: <Text style={styles.value}>{new Date(lap.date).toLocaleString('de-DE')}</Text>
          </Text>
          <Text style={styles.label}>
            Rundenzeit: <Text style={styles.value}>
              {lap.lapTime !== undefined ? lap.lapTime.toFixed(2) : calculateLapTime(lap.throttleData)}s
            </Text>
          </Text>

          <LapChart throttleData={lap.throttleData} />

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
          </View>

          {isReplaying && (
            <Progress.Bar
              progress={progress}
              width={null}
              color="#e53935"
              borderRadius={10}
              unfilledColor="rgba(255,255,255,0.3)"
              borderWidth={0}
            />
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  fullScreenScroll: { flex: 1 },
  detailsContainer: { borderRadius: 20, paddingVertical: 30, paddingHorizontal: 25, marginBottom: 20 },
  glassContainer: {},
  modalTitle: { fontSize: 26, fontWeight: '700', color: '#fefefe', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 18, color: '#fefefe', marginBottom: 8 },
  value: { fontWeight: '600' },
  replayContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  loopContainer: { alignItems: 'flex-start' },
  replayButton: { backgroundColor: 'red', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginLeft: 16, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#e53935', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginLeft: 16, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fefefe', fontWeight: '700', fontSize: 16 },
});