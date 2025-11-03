// app/(tabs)/settings.tsx
import { useMqttStatus } from '@/hooks/use-mqtt-status';
import { setMqttHost } from '@/lib/mqttClient'; // Import the setter function
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const isConnected = useMqttStatus();
  const [modalVisible, setModalVisible] = useState(false);
  const [host, setHost] = useState('localhost'); // Default host
  const [currentHost, setCurrentHost] = useState('localhost'); // For display


  const colorScheme = useColorScheme();

  const textStyle = {
    color: colorScheme === 'dark' ? 'white' : 'black',
  };

  useEffect(() => {
    const loadCurrentHost = async () => {
      const storedHost = await AsyncStorage.getItem('mqtt_host');
      if (storedHost) {
        setHost(storedHost);
        setCurrentHost(storedHost);
      }
    };
    loadCurrentHost();
  }, []);

  const handleSave = async () => {
    await setMqttHost(host); // Use the setter to update and reconnect
    setCurrentHost(host); // Update display
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={{ paddingTop: headerHeight }}>
      <View style={styles.hostContainer}>
        <Text style={[styles.hostText, textStyle]}>Verbindungsstatus:</Text>
        {isConnected ?
          <View style={{ flex: 1, flexDirection: "row", alignItems: 'center', gap: 4, }}>
            <Ionicons color={"green"} name="checkmark-circle-outline" size={20} />
            <Text style={textStyle}>Verbunden</Text> 
          </View>
          :
          <View style={{ flex: 1, flexDirection: "row", alignItems: 'center', gap: 4 }}>
            <Ionicons color={"red"} name="close-circle-outline" size={20} />
            <Text style={textStyle}>Getrennt</Text> 
          </View>}
      </View>
      <View style={styles.hostContainer}>
        <Text style={[styles.hostText, textStyle]}>MQTT Host: {currentHost}</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MQTT Host Adresse ändern</Text>
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder="z.B. localhost"
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.modalButtonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  hostContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostText: {
    fontSize: 18,
    marginRight: 16,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});