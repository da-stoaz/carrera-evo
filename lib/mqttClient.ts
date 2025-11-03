import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from 'events';
import Paho from "paho-mqtt";

// The Paho.Client instance
let client: Paho.Client | null = null;

let host = 'localhost';
const topic = "throttle";

// Event emitter for status changes
const statusEmitter = new EventEmitter();

async function loadHost() {
  const storedHost = await AsyncStorage.getItem('mqtt_host');
  if (storedHost) {
    host = storedHost;
  }
}

// Queue to hold subscriptions requested before connection is established
const subscriptionQueue: { topic: string, callback: (payload: string) => void }[] = [];

// A map to store callback functions for specific topics
const topicCallbacks: Map<string, (payload: string) => void> = new Map();

// --- Connection and Lifecycle ---

export async function initMqtt() {
  await loadHost();

  if (client) {
    console.warn("MQTT client is already initialized.");
    return;
  }

  // Initialize the client instance
  client = new Paho.Client(
    host,
    Number(9001),
    '/',
    `clientId-${Math.random().toString(16).substring(2, 8)}` // Use a unique client ID
  );

  // Set message handler
  client.onMessageArrived = (message: Paho.Message) => {
    console.log(`[MQTT] Message received on topic: ${message.destinationName}`, message.payloadString);
    // You would typically use a state hook or an event emitter here
    // to pass the message payload to your React components.
  };

  // Set connection lost handler
  client.onConnectionLost = (responseObject: { errorCode: number, errorMessage: string }) => {
    if (responseObject.errorCode !== 0) {
      console.log(`[MQTT] Connection lost: ${responseObject.errorMessage}`);
      // Implement a reconnect logic here if necessary
      statusEmitter.emit('statusChange', false); // Emit disconnected
    }
  };

  // Connect to the broker
  client.connect({
    onSuccess: () => {
      console.log('[MQTT] Connected successfully. Processing subscription queue...');
      // 1. Process the subscriptions that were requested while connecting
      subscriptionQueue.forEach(({ topic, callback }) => {
        // Re-call the actual subscription logic
        client!.subscribe(topic);
        topicCallbacks.set(topic, callback);
        console.log(`[MQTT] Queued subscription processed: ${topic}`);
      });
      subscriptionQueue.length = 0; // Clear the queue

      client!.subscribe('test');
      statusEmitter.emit('statusChange', true); // Emit connected
    },
    onFailure: (error) => {
      console.error("MQTT Connection Failed. Check 'host' Details:" + error);
      statusEmitter.emit('statusChange', false); // Emit disconnected on failure
    },
    // userName: 'ubuntu',
    // password: 'Charge.1988',
    useSSL: false,
  });
}

export function disconnectMqtt() {
  if (client && client.isConnected()) {
    try {
      client.disconnect();
      console.log('[MQTT] Disconnected.');
      statusEmitter.emit('statusChange', false); // Emit disconnected
    } catch (e) {
      console.error('[MQTT] Error during disconnect:', e);
    }
  }
  client = null;
}

export function getConnectionStatus(){
  return client ? client.isConnected() : false;
}


export async function setMqttHost(newHost: string) {
  host = newHost;
  await AsyncStorage.setItem('mqtt_host', newHost);
  if (client) {
    disconnectMqtt();
    await initMqtt(); // Reconnect with new host
  }
}

// --- Publishing Logic ---

export function publishThrottle(throttleValue: number) {
  if (!client || !client.isConnected()) {
    console.warn('[MQTT] Cannot publish, client is not connected.');
    return;
  }

  const pahoMessage = new Paho.Message(throttleValue.toString());
  pahoMessage.destinationName = topic;

  try {
    client.send(pahoMessage);
    console.log(`[MQTT] Published to ${topic}: ${throttleValue}`);
  } catch (e) {
    console.error(`[MQTT] Failed to publish to ${topic}:`, e);
  }
}

export function sendMessage(topic: string, message: string) {
  if (!client || !client.isConnected()) {
    console.warn('[MQTT] Cannot publish, client is not connected.');
    return
  }

  const pahoMessage = new Paho.Message(message)
  pahoMessage.destinationName = topic;

  try {
    client.send(pahoMessage);
    console.log(`[MQTT] Published to ${topic}: ${message}`);
  } catch (e) {
    console.error(`[MQTT] Failed to publish to ${topic}:`, e);

  }
}

/**
 * Subscribes to a specified topic and registers a function to execute 
 * when a message is received on that topic.
 * @param topic The MQTT topic to subscribe to.
 * @param callback The function to call with the message payload when a message arrives.
 */
export function subscribeToTopic(topic: string, callback: (payload: string) => void) {
  if (!client || !client.isConnected()) {
    console.warn(`[MQTT] Client not connected. Queueing subscription for topic: ${topic}`);
    // Queue the subscription request for later processing
    subscriptionQueue.push({ topic, callback }); 
    return;
  }

  // If connected, proceed as before
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

// Export the emitter for hooks to listen
export { statusEmitter };
