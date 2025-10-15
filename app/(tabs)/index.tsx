import ThrottleControl from '@/components/throttle-control';
import { disconnectMqtt, initMqtt, publishThrottle } from '@/lib/mqttClient';
import { useEffect } from 'react';
import { SafeAreaView, } from 'react-native-safe-area-context';

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
    // Add flex: 1 explicitly (moved comment outside JSX)
    <SafeAreaView style={{ flex: 1 }}>
      
     <ThrottleControl />
    </SafeAreaView>
  );
}