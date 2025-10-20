// app/(tabs)/laps.tsx
import { publishThrottle } from '@/lib/mqttClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// If needed for replay: import { publishThrottle } from '@/lib/mqttClient'; // Adjust based on your MQTT setup

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
      if (json) {
        console.log(json)

        setLaps(JSON.parse(json) as Lap[]);
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

  const calculateAverageGas = (throttleData: ThrottleDataPoint[]): string => {
    if (!throttleData || !throttleData.length) return '0.0';
    const sum = throttleData.reduce((acc, { v: value }) => acc + value, 0);
    return (sum / throttleData.length).toFixed(1);
  };

  const calculateLapTime = (throttleData: ThrottleDataPoint[]): string => {
    if (!throttleData || !throttleData.length) return '0.00';
    const start = throttleData[0].t;
    const end = throttleData[throttleData.length - 1].t;
    // Assuming time in ms, convert to seconds
    return ((end - start) / 1000).toFixed(2);
  };

  const replayLap = (throttleData: ThrottleDataPoint[]) => {
    if (!throttleData || !throttleData.length) return;
    const startTime = throttleData[0].t;
    throttleData.forEach(({ t: time, v: value }) => {
      setTimeout(() => {
        console.log(time)
        // Replace with actual publish to MQTT, e.g., publishThrottle('throttle/topic', value.toString());
        //console.log(`Replaying throttle: ${value}%`);
        publishThrottle(value)
      }, time - startTime);
    });
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
    <View style={styles.listItem}>
      <View style={styles.infoContainer}>
        <Text style={styles.listText}>
          Rundenzeit: {item.lapTime !== undefined ? item.lapTime.toFixed(2) : calculateLapTime(item.throttleData)}s
        </Text>
        <Text style={styles.listText}>
          Datum: {new Date(item.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => replayLap(item.throttleData)}>
          <Text style={styles.buttonText}>Abspielen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setSelectedLap(item)}>
          <Text style={styles.buttonText}>Betrachten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Aufgezeichnete Runden</Text>
        <FlatList<Lap> // Type the FlatList data
          data={laps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>Keine Runden aufgezeichnet.</Text>}
        />
        <Modal
          visible={!!selectedLap}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedLap(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedLap && (
                <>
                  <Text style={styles.modalTitle}>Rundendetails</Text>
                  <Text>Durchschnittliche Gasposition: {calculateAverageGas(selectedLap.throttleData)}%</Text>
                  <Text>Timestamp der Aufzeichnung: {new Date(selectedLap.date).toLocaleString('de-DE')}</Text>
                  {/* Display calculated lap time if pre-calculated isn't used */}
                  <Text>Rundenzeit: {selectedLap.lapTime !== undefined ? selectedLap.lapTime.toFixed(2) : calculateLapTime(selectedLap.throttleData)}s</Text>

                  <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedLap(null)}>
                    <Text style={styles.closeButtonText}>Schließen</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
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
    flexDirection: 'column',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
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