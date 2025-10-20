import ThrottleControl from '@/components/throttle-control';
import { disconnectMqtt, initMqtt, sendMessage } from '@/lib/mqttClient';
import { useEffect } from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {

  useEffect(() => {
    initMqtt();

    // Publish a test message after connecting
    const timer = setTimeout(() => {
      sendMessage("throttle", "initialized")
    }, 3000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      disconnectMqtt();
    };
  }, []);

  return (
    // Add flex: 1 explicitly (moved comment outside JSX)
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={styles.header}>Carrera Throttle Control</Text>
      <Button
        title="Record Lap"
        onPress={() => {
          // handle button press
        }}
      />

      <ThrottleControl />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: "center",
    marginBottom: 40,
  },
})