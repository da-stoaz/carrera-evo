import ThrottleControl from '@/components/throttle-control';
import { disconnectMqtt, initMqtt, publishThrottle } from '@/lib/mqttClient';
import { useEffect } from 'react';
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'; // Change this import


export default function HomeScreen() {

  useEffect(() => {
    initMqtt();

    // Publish a test message after connecting
    const timer = setTimeout(() => {
      publishThrottle('test', 'Hello from Expo HomeScreen!');
    }, 3000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      disconnectMqtt();
    };
  }, []);


  return (
    <SafeAreaView style={{ flex: 1 }}> {/* Add flex: 1 explicitly */}
      
     <ThrottleControl />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 50,
  },
  slider: {
    width: 50,
    height: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'relative',
    marginBottom: 50,
  },
  rail: {
    width: 20,
    height: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: '#DBDBDB',
  },
  stepper: {
    width: '100%',
    height: 5,
    backgroundColor: 'black',
  },
});