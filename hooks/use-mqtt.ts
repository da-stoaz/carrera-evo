import { disconnectMqtt, initMqtt, publishThrottle } from "@/app/services/mqttClient";
import { useEffect } from 'react';

export function useMqtt() {
  useEffect(() => {
    initMqtt();

    return () => {
      disconnectMqtt();
    };
  }, []);

  return { publishThrottle };
}
