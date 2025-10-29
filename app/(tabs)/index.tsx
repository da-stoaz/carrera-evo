import { Images } from '@/assets';
import ThrottleControl from '@/components/throttle-control';
import { useThrottleRecorder } from '@/hooks/useThrottleRecorder';
import { disconnectMqtt, initMqtt, publishThrottle, subscribeToTopic } from '@/lib/mqttClient';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


function handleLightGateTriggered(payload: string) {
  console.log(`Status update received: ${payload}`);
}

export default function HomeScreen() {
  const headerHeight = useHeaderHeight()
  const { isRecording, data, start, stop, addThrottlePoint, save } = useThrottleRecorder();
  const [throttleValue, setThrottleValue] = useState(0);

  // TODO: In the future, replace this calculation with real voltage data subscribed from the MQTT broker
  const voltage = (throttleValue / 100) * 15;


  const toggleRecording = async () => {
    if (isRecording) {
      const recordedDataPoints = stop();
      console.log('Lap finished –', JSON.stringify(recordedDataPoints, null, 2));
      const savedLap = await save();
      console.log('Saved lap ID:', savedLap.id);

    } else {
      start();
    }
  };

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
      source={Images.raceTrack}
      style={styles.background}
      blurRadius={40}
    >
      <View style={styles.overlay} />
      <View style={[styles.container, { paddingTop: headerHeight + 20 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.recordButton}
          onPress={toggleRecording}
        >
          <Text style={styles.recordButtonText}>
            {!isRecording ? "Runde Aufzeichnen" : "Aufzeichnung beenden"}
          </Text>
        </TouchableOpacity>
        <View style={styles.throttleContainer}>

          <Text style={styles.valueText}>{throttleValue !== 100 ? throttleValue.toFixed(1) : throttleValue}%</Text>
          <ThrottleControl onThrottleChange={(throttle) => {
            setThrottleValue(throttle)
            console.log(throttle)
            publishThrottle(throttle)
            if (isRecording) addThrottlePoint(throttle)
          }} />

          <Text style={styles.voltageText}>{voltage.toFixed(1)}V</Text>
        </View>

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
  throttleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: 'center',
    gap: 10
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
  valueText: {
    flex: 1,
    textAlign: "right",
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  voltageText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
})