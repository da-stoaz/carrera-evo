import { getConnectionStatus, statusEmitter } from '@/lib/mqttClient';
import { useEffect, useState } from 'react';

export function useMqttStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial check
    setIsConnected(getConnectionStatus());

    // Listen for changes
    const handleStatusChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    statusEmitter.on('statusChange', handleStatusChange);

    // Cleanup
    return () => {
      statusEmitter.off('statusChange', handleStatusChange);
    };
  }, []);

  return isConnected;
}