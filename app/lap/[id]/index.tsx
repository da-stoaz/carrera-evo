import { Images } from '@/assets';
import ReplayLap from '@/components/ReplayLap';
import { useLapsContext } from '@/context/LapsContext';
import { calculateAverageGas, calculateLapTime } from "@/lib/utils";
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import LapChart from './LapChart';

export default function LapDetailsPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const lapId = typeof id === 'string' ? parseInt(id, 10) : null;

  const { laps, isLoading } = useLapsContext(); // ← Use custom hook


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


          <ReplayLap throttleData={lap.throttleData} />

       
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  fullScreenScroll: { 
    flex: 1 
  },
  detailsContainer: { 
    borderRadius: 20, 
    paddingVertical: 30, 
    paddingHorizontal: 25, 
    marginBottom: 20 
  },
  glassContainer: {},
  modalTitle: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#fefefe', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  label: { 
    fontSize: 18, 
    color: '#fefefe', 
    marginBottom: 8 
  },
  value: { 
    fontWeight: '600' 
  },
  replayContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    marginBottom: 20 
  },
  loopContainer: { 
    alignItems: 'flex-start' 
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