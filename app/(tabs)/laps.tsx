import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { SafeAreaView } from 'react-native-safe-area-context';

// Initialize MMKV storage. In a real app, you might do this in a central file.
const storage = new MMKV();

// --- Type Definitions ---
// Defines a single throttle data point with a relative timestamp.
type ThrottleDataPoint = {
  t: number; // Time in milliseconds relative to the start of the lap
  v: number; // Throttle value (e.g., 0.0 to 1.0)
};

// Defines the structure of a complete Lap object used in the component's state.
type Lap = {
  id: string;          // The unique key from storage, e.g., "lap_1729110960000"
  date: number;        // The absolute timestamp (ms) when the lap started
  lapTime: number;     // The total duration of the lap in seconds
  throttleData: ThrottleDataPoint[];
};

// --- Component ---
export default function LapsScreen() {
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);

  // Load laps from storage when the component mounts.
  useEffect(() => {
    loadLaps();
  }, []);

  /**
   * Loads all lap data from MMKV storage.
   * It finds all keys prefixed with "lap_", then parses each one into a Lap object.
   */
  const loadLaps = () => {
    try {
      const lapKeys = storage.getAllKeys().filter((key) => key.startsWith('lap_'));

      const loadedLaps: Lap[] = lapKeys.map((key) => {
        const json = storage.getString(key);
        if (!json) return null;

        const throttleData: ThrottleDataPoint[] = JSON.parse(json);
        const dateTimestamp = parseInt(key.split('_')[1], 10);

        return {
          id: key,
          date: dateTimestamp,
          lapTime: calculateLapTime(throttleData),
          throttleData,
        };
      }).filter((lap): lap is Lap => lap !== null) // Filter out any nulls from failed parses
        .sort((a, b) => b.date - a.date); // Sort laps by date, newest first

      setLaps(loadedLaps);
    } catch (e) {
      console.error('Failed to load laps from MMKV', e);
    }
  };

  /**
   * Deletes a single lap from both MMKV storage and the component's state.
   * @param lapId The unique ID/key of the lap to delete.
   */
  const deleteLap = (lapId: string) => {
    try {
      storage.delete(lapId);
      // Update state to reflect the deletion in the UI immediately
      setLaps((prevLaps) => prevLaps.filter((lap) => lap.id !== lapId));
    } catch (e) {
      console.error(`Failed to delete lap ${lapId}`, e);
    }
  };

  const calculateAverageGas = (throttleData: ThrottleDataPoint[]) => {
    if (!throttleData || throttleData.length === 0) return '0.0';
    const sum = throttleData.reduce((acc, { v }) => acc + v, 0);
    // Assuming 'v' is 0-1, multiply by 100 for percentage
    return ((sum / throttleData.length) * 100).toFixed(1);
  };

  const calculateLapTime = (throttleData: ThrottleDataPoint[]) => {
    if (!throttleData || throttleData.length === 0) return 0;
    // The lap time is simply the timestamp of the last data point
    const lastTimestamp = throttleData[throttleData.length - 1].t;
    return lastTimestamp / 1000; // Convert ms to seconds
  };

  const replayLap = (throttleData: ThrottleDataPoint[]) => {
    if (!throttleData || throttleData.length === 0) return;
    console.log('Starting lap replay...');
    throttleData.forEach(({ t, v }) => {
      setTimeout(() => {
        // Replace with actual publish to MQTT, e.g., publishThrottle('throttle/topic', v.toString());
        console.log(`Replaying throttle at ${t}ms: ${v.toFixed(2)}`);
      }, t); // 't' is already relative to the start, no subtraction needed
    });
  };

  const handleDeletePress = (id: string) => {
    Alert.alert('Löschen', 'Sind Sie sicher, dass Sie diese Runde löschen möchten?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => deleteLap(id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Lap }) => (
    <View style={styles.listItem}>
      <View style={styles.lapInfo}>
        <Text style={styles.lapTimeText}>{item.lapTime.toFixed(2)}s</Text>
        <Text style={styles.lapDateText}>{new Date(item.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => replayLap(item.throttleData)}>
          <Text style={styles.buttonText}>Abspielen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedLap(item)}>
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
          <Text style={[styles.buttonText, styles.deleteButtonText]}>Löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={laps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
                <Text style={styles.modalDetail}>Durchschnittliche Gasposition: {calculateAverageGas(selectedLap.throttleData)}%</Text>
                <Text style={styles.modalDetail}>Aufgezeichnet am: {new Date(selectedLap.date).toLocaleString('de-DE')}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedLap(null)}>
                  <Text style={styles.closeButtonText}>Schließen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Darker background
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1E1E1E',
  },
  lapInfo: {
    flex: 1,
  },
  lapTimeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lapDateText: {
    color: '#aaa',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#007AFF', // Brighter blue for actions
    marginLeft: 15,
    fontSize: 16,
  },
  deleteButtonText: {
    color: '#FF3B30', // Red for delete
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    padding: 20,
    borderRadius: 14,
    alignItems: 'flex-start',
    width: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    alignSelf: 'center',
  },
  modalDetail: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
