import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from "paho-mqtt";
import Toast from 'react-native-toast-message';

let client: Paho.Client | null = null;
let host = 'localhost';
let throttleTopic = "throttle";

const statusListeners = new Set<(connected: boolean) => void>();

export const statusEmitter = {
  on: (_event: string, fn: (connected: boolean) => void) => statusListeners.add(fn),
  off: (_event: string, fn: (connected: boolean) => void) => statusListeners.delete(fn),
};

function emitStatus(connected: boolean) {
  statusListeners.forEach(fn => fn(connected));
}

const subscriptionQueue: { topic: string; callback: (payload: string) => void }[] = [];
const topicCallbacks = new Map<string, (payload: string) => void>();

async function loadHost() {
  const stored = await AsyncStorage.getItem('mqtt_host');
  if (stored) host = stored;
}

async function loadThrottleTopic() {
  const stored = await AsyncStorage.getItem('mqtt_throttle_topic');
  if (stored) throttleTopic = stored;
}

export async function initMqtt() {
  await loadHost();
  await loadThrottleTopic();

  if (client) {
    console.warn("MQTT client is already initialized.");
    return;
  }

  client = new Paho.Client(
    host,
    9001,
    '/',
    `clientId-${Math.random().toString(16).substring(2, 8)}`
  );

  client.onMessageArrived = (message: Paho.Message) => {
    const payload = message.payloadString;
    console.log(`[MQTT] Message received on topic: ${message.destinationName}`, payload);
    topicCallbacks.get(message.destinationName)?.(payload);
  };

  client.onConnectionLost = (responseObject: { errorCode: number; errorMessage: string }) => {
    if (responseObject.errorCode !== 0) {
      console.log(`[MQTT] Connection lost: ${responseObject.errorMessage}`);
      emitStatus(false);
    }
  };

  client.connect({
    onSuccess: async () => {
      console.log('[MQTT] Connected. Processing subscription queue...');

      subscriptionQueue.forEach(({ topic, callback }) => {
        client!.subscribe(topic);
        topicCallbacks.set(topic, callback);
      });
      subscriptionQueue.length = 0;

      client!.subscribe(throttleTopic);
      console.log(`[MQTT] Auto-subscribed to throttle topic: ${throttleTopic}`);

      emitStatus(true);
    },
    onFailure: (error) => {
      Toast.show({
        type: "error",
        text1: "MQTT Verbindung fehlgeschlagen",
        text2: error.errorMessage,
      });
      emitStatus(false);
    },
    useSSL: false,
  });
}

export function disconnectMqtt() {
  if (client && client.isConnected()) {
    try {
      topicCallbacks.forEach((_, topic) => {
        try {
          client!.unsubscribe(topic);
        } catch (e) {
          console.warn(`[MQTT] Failed to unsubscribe from ${topic}:`, e);
        }
      });
      topicCallbacks.clear();
      client.disconnect();
      emitStatus(false);
    } catch (e) {
      Toast.show({ type: "error", text1: "Fehler beim Trennen der Verbindung" });
    }
  }
  client = null;
}

export function getConnectionStatus() {
  return client ? client.isConnected() : false;
}

export async function setMqttHost(newHost: string) {
  host = newHost;
  await AsyncStorage.setItem('mqtt_host', newHost);
  if (client) {
    disconnectMqtt();
    await initMqtt();
  }
}

export async function setThrottleTopic(newTopic: string) {
  if (!newTopic || newTopic.trim() === '') {
    console.warn('[MQTT] Throttle topic cannot be empty.');
    return;
  }

  const oldTopic = throttleTopic;
  throttleTopic = newTopic.trim();
  await AsyncStorage.setItem('mqtt_throttle_topic', throttleTopic);

  if (client && client.isConnected()) {
    if (oldTopic !== throttleTopic) {
      try {
        client.unsubscribe(oldTopic);
      } catch (e) {
        console.warn(`[MQTT] Failed to unsubscribe from old throttle topic ${oldTopic}:`, e);
      }
    }

    client.subscribe(throttleTopic, {
      onSuccess: () => console.log(`[MQTT] Subscribed to new throttle topic: ${throttleTopic}`),
      onFailure: (err) => Toast.show({
        type: "error",
        text1: "MQTT Subscription Fehler",
        text2: `Failed to subscribe to ${throttleTopic}: ${err.errorMessage}`,
      }),
    });
  }
}

export function publishThrottle(throttleValue: number) {
  if (!client || !client.isConnected()) {
    console.warn('[MQTT] Cannot publish, client is not connected.');
    return;
  }

  const message = new Paho.Message(throttleValue.toString());
  message.destinationName = throttleTopic;

  try {
    client.send(message);
  } catch (e) {
    Toast.show({
      type: "error",
      text1: "MQTT Fehler",
      text2: `Failed to publish to ${throttleTopic}: ${e}`,
    });
  }
}

export function subscribeTopic(topic: string, callback: (payload: string) => void) {
  if (!client || !client.isConnected()) {
    console.warn(`[MQTT] Client not connected. Queueing subscription for topic: ${topic}`);
    subscriptionQueue.push({ topic, callback });
    return;
  }

  client.subscribe(topic, {
    onSuccess: () => {
      console.log(`[MQTT] Subscribed to topic: ${topic}`);
      topicCallbacks.set(topic, callback);
    },
    onFailure: (error) => Toast.show({
      type: "error",
      text1: "MQTT Fehler",
      text2: `Failed to subscribe to ${topic}: ${error.errorMessage}`,
    }),
  });
}
