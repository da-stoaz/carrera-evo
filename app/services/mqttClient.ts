import { createMqttClient } from '@d11/react-native-mqtt/dist/Mqtt';

let mqttClient: any | null = null;

export const initMqtt = async () => {
    if (mqttClient) return mqttClient;

    mqttClient = createMqttClient({
        host: "",
        port: 1833,
        clientId: `rn-${Date.now()}`,
        options: {
            keepAlive: 60,

        }
    });

    mqttClient.on('connect', () => console.log('✅ MQTT connected'));
    mqttClient.on('error', (err: any) => console.error('❌ MQTT error:', err));
    mqttClient.on('message', (msg: any) => console.log(`📨 ${msg.topic}: ${msg.data}`));

    mqttClient.connect();
    return mqttClient;
};

export const publishThrottle = (value: number) => {
    if (!mqttClient) {
        console.warn('MQTT not connected');
        return;
    }
    mqttClient.publish('vehicle/throttle', JSON.stringify({ value }), 0, false);
};

export const disconnectMqtt = () => {
    mqttClient?.disconnect();
    mqttClient = null;
};
