// screens/LapsScreen.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Images } from '@/assets';
import { useLapsContext } from '@/context/LapsContext';
import { calculateLapTime } from '@/lib/utils';
import { Lap, ThrottleDataPoint } from '@/types/types';
import { useHeaderHeight } from '@react-navigation/elements';

export default function LapsScreen() {
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const { laps, isLoading, deleteLap, addLap } = useLapsContext();

  // Generate sample data **only once** when no laps exist
  useEffect(() => {
    if (!isLoading && (!laps || laps.length === 0)) {
      const sample = Array.from({ length: 10000 }, (_, i) => ({
        t: i,
        v: Math.round((Math.sin(i / 100) + 1) * 50),
      })) as ThrottleDataPoint[];

      const initialLaps: Lap[] = [
        { id: 1, date: new Date("2025-10-15"), throttleData: sample },
        { id: 2, date: new Date("2025-10-15"), throttleData: sample.slice(5000, 8888) },
        { id: 3, date: new Date("2025-10-15"), throttleData: sample.slice(444, 9330) },
        { id: 4, date: new Date("2025-10-15"), throttleData: sample.slice(3453, 10000) },
        { id: 5, date: new Date("2025-10-15"), throttleData: sample.slice(100, 8004) },
      ];

      initialLaps.forEach(lap => addLap(lap.throttleData));
    }
  }, [isLoading, laps, addLap]);

  const handleDelete = (id: number) => {
    Alert.alert(`Runde ${id} Löschen?`, 'Eine Wiederherstellung ist nicht möglich.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteLap(id) },
    ]);
  };

  const handleSelectLap = (lap: Lap) => {
    router.push(`/lap/${lap.id}`);
  };

  const renderItem = ({ item }: { item: Lap }) => {
    const lapTime = item.lapTime ?? calculateLapTime(item.throttleData);

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleSelectLap(item)}
        activeOpacity={0.6}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.listText}>Runde {item.id}</Text>
          <Text style={styles.listText}>
            {item.date.toLocaleString('de-DE', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
          <Text style={styles.listText}>{lapTime.toFixed(2)}s</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Löschen</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ImageBackground source={Images.raceTrack} style={styles.background} blurRadius={20}>
        <View style={styles.overlay} />
        <View style={styles.container}>
          <Text style={styles.emptyText}>Lade Runden...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={Images.raceTrack}
      style={styles.background}
      resizeMode="cover"
      blurRadius={20}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <FlatList<Lap>
          data={laps}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={
            laps.length === 0 ? styles.emptyContainer : { paddingTop: headerHeight }
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Keine Runden aufgezeichnet.</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ImageBackground>
  );
}

// Styles (unchanged)
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 6,
  },
  listText: {
    fontSize: 17,
    color: '#fefefe',
    fontWeight: '500',
    flexWrap: 'wrap',
    fontFamily: 'System',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'System',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    color: '#fefefe',
    fontFamily: 'System',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});