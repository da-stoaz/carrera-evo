import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { calculateLapTime } from '@/lib/utils';
import { Lap } from '@/types/types';



export default function LapsScreen() {
  const router = useRouter();
  const [laps, setLaps] = useState<Lap[]>([]);

  useEffect(() => {
    loadLaps();
  }, []);

  const loadLaps = async () => {
    const throttlesample = Array.from({ length: 10000 }, (_, i) => ({
      t: i, // unique ascending value
      v: Math.round((Math.sin(i / 100) + 1) * 50)
    }));

    try {
      const json = await AsyncStorage.getItem('laps');
      if (json && JSON.parse(json).length > 0) {
        let laps = JSON.parse(json);
        setLaps(laps as Lap[]);
      } else {
        // Sample data for initial load
        const initialLaps: Lap[] = [
          { id: 1, date: new Date("2025-10-15").getTime(), throttleData: throttlesample },
          { id: 2, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(5000, 8888) },
          { id: 3, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(444, 9330) },
          { id: 4, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(3453, 10000) },
          { id: 5, date: new Date("2025-10-15").getTime(), throttleData: throttlesample.slice(100, 8004) }
        ];
        setLaps(initialLaps);
        saveLaps(initialLaps);
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

  const handleSelectLap = (lap: Lap) => {
    router.push(`/lap/${lap.id.toString()}`);
  };

  const renderItem = ({ item }: { item: Lap }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectLap(item)}
      activeOpacity={0.6}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.listText}>
          {`Runde ${item.id}`}
        </Text>
        <Text style={styles.listText}>
          {new Date(item.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
        <Text style={styles.listText}>
          {item.lapTime !== undefined ? item.lapTime.toFixed(2) : calculateLapTime(item.throttleData)}s
        </Text>
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

  return (
    <ImageBackground
      source={{ uri: 'https://wallpapers.com/images/hd/race-track-pictures-w4p4u0usrxl8bqii.jpg' }}
      style={styles.background}
      resizeMode="cover"
      blurRadius={20}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.header}>Aufgezeichnete Runden</Text>
        <FlatList<Lap>
          data={laps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={laps.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>Keine Runden aufgezeichnet.</Text>}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 54,
    textAlign: 'center',
    color: '#fefefe',
    fontFamily: 'System',
  },
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