import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    >
      <View style={styles.infoContainer}>
        <Text style={styles.listText}>
          {item.id}
        </Text>
        <Text style={styles.listText}>
          {new Date(item.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
        <Text style={styles.listText}>
          {item.lapTime !== undefined ? item.lapTime.toFixed(2) : calculateLapTime(item.throttleData)}s
        </Text>

      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={(e) => {
        e.stopPropagation();
        handleDelete(item.id);
      }}>
        <Text style={styles.buttonText}>Löschen</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Laps' }} />
      <View style={styles.container}>
        <Text style={styles.header}>Aufgezeichnete Runden</Text>
        <FlatList<Lap>
          data={laps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>Keine Runden aufgezeichnet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Keep existing styles)
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
});