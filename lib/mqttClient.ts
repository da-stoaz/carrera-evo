
import Paho from "paho-mqtt";

// The Paho.Client instance
let client: Paho.Client | null = null;

const host = '10.20.131.101'; 

// --- Connection and Lifecycle ---

export function initMqtt() {
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
    }
  };

  // Connect to the broker
  client.connect({
    onSuccess: () => {
      console.log('[MQTT] Connected successfully.');
      // Subscribe immediately upon connection
      client!.subscribe('test');
    },
    onFailure: (error) => {
      console.error(error)
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
    } catch (e) {
      console.error('[MQTT] Error during disconnect:', e);
    }
  }
  client = null;
}

// --- Publishing Logic ---

export function publishThrottle(topic: string, message: string) {
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
