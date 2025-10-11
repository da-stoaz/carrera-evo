import { disconnectMqtt, initMqtt, publishThrottle } from "@/lib/mqttClient";
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
