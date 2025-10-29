import ThrottleControl from '@/components/throttle-control';
import { disconnectMqtt, initMqtt, subscribeToTopic } from '@/lib/mqttClient';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


function handleLightGateTriggered(payload: string) {
    console.log(`Status update received: ${payload}`);
}

export default function HomeScreen() {
  const headerHeight = useHeaderHeight()

  useEffect(() => {
    initMqtt();

    subscribeToTopic('lightgate', handleLightGateTriggered);

    // Cleanup on unmount
    return () => {
      disconnectMqtt();
    };
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://wallpapers.com/images/hd/race-track-pictures-w4p4u0usrxl8bqii.jpg' }}
      style={styles.background}
      blurRadius={40}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={[styles.container, {marginTop: headerHeight}]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.recordButton}
          onPress={() => {
            // handle button press
          }}
        >
          <Text style={styles.recordButtonText}>Record Lap</Text>
        </TouchableOpacity>


          <ThrottleControl/>
    
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: "center",
    marginBottom: 40,
    color: '#fefefe',
  },
  recordButton: {
    backgroundColor: '#e53935',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 30,
    alignSelf: 'center',
    minWidth: 150,
    elevation: 3,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  glassContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  throttleTextPercentVolt: {
    color: '#e53935',
  },
})