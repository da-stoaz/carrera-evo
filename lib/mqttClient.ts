import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from 'events';
import Paho from "paho-mqtt";

// The Paho.Client instance
let client: Paho.Client | null = null;

// Configurable defaults
let host = 'localhost';
let throttleTopic = "throttle"; // Now configurable

// Event emitter for status changes
const statusEmitter = new EventEmitter();

// Queue to hold subscriptions requested before connection is established
const subscriptionQueue: { topic: string, callback: (payload: string) => void }[] = [];

// A map to store callback functions for specific topics
const topicCallbacks: Map<string, (payload: string) => void> = new Map();

// --- Persistence & Config Loaders ---

async function loadHost() {
  const storedHost = await AsyncStorage.getItem('mqtt_host');
  if (storedHost) {
    host = storedHost;
  }
}

export async function loadThrottleTopic() {
  const storedTopic = await AsyncStorage.getItem('mqtt_throttle_topic');
  if (storedTopic) {
    throttleTopic = storedTopic;
  }
}

export async function saveThrottleTopic(topic: string) {
  await AsyncStorage.setItem('mqtt_throttle_topic', topic);
}

// --- Connection and Lifecycle ---

export async function initMqtt() {
  await loadHost();
  await loadThrottleTopic();

  if (client) {
    console.warn("MQTT client is already initialized.");
    return;
  }

  // Initialize the client instance
  client = new Paho.Client(
    host,
    Number(9001),
    '/',
    `clientId-${Math.random().toString(16).substring(2, 8)}`
  );

  // Set message handler
  client.onMessageArrived = (message: Paho.Message) => {
    const payload = message.payloadString;
    console.log(`[MQTT] Message received on topic: ${message.destinationName}`, payload);

    const callback = topicCallbacks.get(message.destinationName);
    if (callback) {
      callback(payload);
    }
  };

  // Set connection lost handler
  client.onConnectionLost = (responseObject: { errorCode: number, errorMessage: string }) => {
    if (responseObject.errorCode !== 0) {
      console.log(`[MQTT] Connection lost: ${responseObject.errorMessage}`);
      statusEmitter.emit('statusChange', false);
    }
  };

  // Connect to the broker
  client.connect({
    onSuccess: async () => {
      console.log('[MQTT] Connected successfully. Processing subscription queue...');

      // Process queued subscriptions
      subscriptionQueue.forEach(({ topic, callback }) => {
        client!.subscribe(topic);
        topicCallbacks.set(topic, callback);
        console.log(`[MQTT] Queued subscription processed: ${topic}`);
      });
      subscriptionQueue.length = 0;

      // Auto-subscribe to the throttle topic
      client!.subscribe(throttleTopic);
      console.log(`[MQTT] Auto-subscribed to throttle topic: ${throttleTopic}`);

      statusEmitter.emit('statusChange', true);
    },
    onFailure: (error) => {
      console.error('[MQTT] Connection failed:', error);
      statusEmitter.emit('statusChange', false);
    },
    useSSL: false,
  });
}

export function disconnectMqtt() {
  if (client && client.isConnected()) {
    try {
      // Unsubscribe from all topics before disconnect
      topicCallbacks.forEach((_, topic) => {
        try {
          client!.unsubscribe(topic);
          console.log(`[MQTT] Unsubscribed from ${topic} on disconnect`);
        } catch (e) {
          console.warn(`[MQTT] Failed to unsubscribe from ${topic}:`, e);
        }
      });
      topicCallbacks.clear();

      client.disconnect();
      console.log('[MQTT] Disconnected.');
      statusEmitter.emit('statusChange', false);
    } catch (e) {
      console.error('[MQTT] Error during disconnect:', e);
    }
  }
  client = null;
}

export function getConnectionStatus() {
  return client ? client.isConnected() : false;
}

// --- Host Management ---

export async function setMqttHost(newHost: string) {
  host = newHost;
  await AsyncStorage.setItem('mqtt_host', newHost);
  if (client) {
    disconnectMqtt();
    await initMqtt(); // Reconnect with new host
  }
}

// --- Throttle Topic Management ---

export async function setThrottleTopic(newTopic: string) {
  if (!newTopic || newTopic.trim() === '') {
    console.warn('[MQTT] Throttle topic cannot be empty.');
    return;
  }

  const oldTopic = throttleTopic;
  throttleTopic = newTopic.trim();

  await saveThrottleTopic(throttleTopic);

  if (client && client.isConnected()) {
    // Unsubscribe from old topic if it was subscribed
    if (oldTopic !== newTopic && topicCallbacks.has(oldTopic)) {
      try {
        client.unsubscribe(oldTopic);
        topicCallbacks.delete(oldTopic);
        console.log(`[MQTT] Unsubscribed from old throttle topic: ${oldTopic}`);
      } catch (e) {
        console.warn(`[MQTT] Failed to unsubscribe from ${oldTopic}:`, e);
      }
    }

    // Subscribe to new topic
    client.subscribe(newTopic, {
      onSuccess: () => {
        console.log(`[MQTT] Subscribed to new throttle topic: ${newTopic}`);
        // Optionally preserve callback if one exists, or just subscribe
        // Here we don't auto-attach a callback unless previously set via subscribeToTopic
      },
      onFailure: (err) => {
        console.error(`[MQTT] Failed to subscribe to new throttle topic ${newTopic}:`, err);
      }
    });
  }

  console.log(`[MQTT] Throttle topic updated to: ${throttleTopic}`);
}

export function getThrottleTopic() {
  return throttleTopic;
}

// --- Publishing Logic ---

export function publishThrottle(throttleValue: number) {
  if (!client || !client.isConnected()) {
    console.warn('[MQTT] Cannot publish, client is not connected.');
    return;
  }

  const pahoMessage = new Paho.Message(throttleValue.toString());
  pahoMessage.destinationName = throttleTopic;

  try {
    client.send(pahoMessage);
    console.log(`[MQTT] Published to ${throttleTopic}: ${throttleValue}`);
  } catch (e) {
    console.error(`[MQTT] Failed to publish to ${throttleTopic}:`, e);
  }
}

export function sendMessage(topic: string, message: string) {
  if (!client || !client.isConnected()) {
    console.warn('[MQTT] Cannot publish, client is not connected.');
    return;
  }

  const pahoMessage = new Paho.Message(message);
  pahoMessage.destinationName = topic;

  try {
    client.send(pahoMessage);
    console.log(`[MQTT] Published to ${topic}: ${message}`);
  } catch (e) {
    console.error(`[MQTT] Failed to publish to ${topic}:`, e);
  }
}

// --- Subscription Management ---

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
    onFailure: (error) => {
      console.error(`[MQTT] Failed to subscribe to topic ${topic}:`, error);
    }
  });
}

/**
 * Unsubscribes from a topic and removes its callback.
 * @param topic The MQTT topic to unsubscribe from.
 */
export function unsubscribeTopic(topic: string) {
  if (!client || !client.isConnected()) {
    // Remove from queue if queued
    const index = subscriptionQueue.findIndex(sub => sub.topic === topic);
    if (index !== -1) {
      subscriptionQueue.splice(index, 1);
      console.log(`[MQTT] Removed queued subscription for: ${topic}`);
    } else {
      console.warn(`[MQTT] Cannot unsubscribe from ${topic}: client not connected or not queued.`);
    }
    topicCallbacks.delete(topic);
    return;
  }

  try {
    client.unsubscribe(topic, {
      onSuccess: () => {
        console.log(`[MQTT] Successfully unsubscribed from topic: ${topic}`);
        topicCallbacks.delete(topic);
      },
      onFailure: (error) => {
        console.error(`[MQTT] Failed to unsubscribe from topic ${topic}:`, error);
      }
    });
  } catch (e) {
    console.error(`[MQTT] Exception during unsubscribe from ${topic}:`, e);
    topicCallbacks.delete(topic); // Force remove callback anyway
  }
}

// Export the emitter for hooks to listen
export { statusEmitter };
