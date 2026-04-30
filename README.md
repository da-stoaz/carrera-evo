# Carrera-Evo

A React Native (Expo) app to remotely control a Carrera slot-car track over MQTT.
This is an HTL school project. The UI is in German.

The app:
- Sends a **throttle value** (0–100) to the car controller via MQTT.
- Subscribes to a **lightgate** topic to detect when the car crosses a sensor (for lap timing).
- Lets you replay recorded laps.

```
[Phone App] --(WebSocket :9001)--> [MQTT Broker] --(MQTT :1883)--> [Car Controller / Lightgate]
```

---

## 1. Prerequisites

Install these once on your machine:

| Tool | Why | How |
|---|---|---|
| **Node.js 20.19+ / 22.13+ / 24.3+** | Runs the build tools | https://nodejs.org (pick LTS) |
| **Git** | Clone the repo | https://git-scm.com |
| **Docker Desktop** | Runs the local MQTT broker | https://www.docker.com/products/docker-desktop |
| **Xcode 26+** *(only for iOS)* | Builds the iOS app | Mac App Store |
| **Android Studio** *(only for Android)* | Builds the Android app | https://developer.android.com/studio |

Check your Node version:
```bash
node --version    # must be >= 20.19
```

---

## 2. Clone and install dependencies

```bash
git clone <repo-url> carrera-evo
cd carrera-evo
npm install
```

---

## 3. Start the MQTT broker

The app talks to your car via an MQTT broker (Eclipse Mosquitto). A ready-to-use Docker setup is included.

```bash
cd mqtt-mosquitto
docker compose up -d
```

This starts a broker that listens on:
- **Port 1883** — native MQTT (used by the car controller / Arduino / ESP32)
- **Port 9001** — MQTT over WebSocket (used by **this app** — phones can't speak raw MQTT)

To stop the broker later:
```bash
docker compose down
```

To view broker logs:
```bash
docker compose logs -f
```

> **Note:** anonymous connections are allowed in the included config. Do not expose this broker to the public internet.

---

## 4. Find your computer's IP address

The phone needs to reach the broker over your local network. `localhost` only works if app and broker run on the same machine — usually the broker runs on your laptop and the app runs on your phone, so you need the **laptop's LAN IP**.

- **macOS / Linux:** `ipconfig getifaddr en0` (Wi-Fi) or `ip addr`
- **Windows:** `ipconfig` (look for IPv4 Address under your Wi-Fi adapter)

Example: `192.168.0.42`

The phone and the laptop must be on the **same Wi-Fi network**.

---

## 5. Run the app

The app uses a custom development build (not Expo Go), so the first run on each device must do a native build.

### iOS (Mac only)

```bash
npx expo run:ios
```

This compiles the iOS app, installs it on the simulator (or a connected iPhone), and launches the Metro bundler.

To build to a physical iPhone, plug it in and run:
```bash
npx expo run:ios --device
```

### Android

Start an emulator from Android Studio (or plug in a phone with USB debugging enabled), then:

```bash
npx expo run:android
```

### Subsequent runs

Once the native app is installed on the device, you only need the dev server:

```bash
npx expo start
```

Open the app on your device — it will auto-connect to the dev server.

---

## 6. Configure the app to talk to the broker

When the app starts, open the **Settings** tab (Einstellungen) and:

1. Tap **Edit** next to **MQTT Host** → enter your laptop's LAN IP (e.g. `192.168.0.42`) → **Speichern**.
2. Tap **Edit** next to **MQTT Topic** → enter the topic the car listens on (default: `throttle`) → **Speichern**.

The **Verbindungsstatus** (connection status) row should turn green ("Verbunden") once connected.

The host and topic are saved on the device, so you only need to set them once.

---

## 7. MQTT topics

| Topic | Direction | Payload | Purpose |
|---|---|---|---|
| `throttle` *(configurable)* | app → car | number `0`–`100` as string | Throttle value sent when you move the slider |
| `lightgate` | car → app | any string (trigger) | Sensor message; app uses it for lap timing |

You can verify messages with the `mosquitto_sub` CLI:
```bash
docker exec -it mqtt-broker mosquitto_sub -t '#' -v
```

Or publish a test message manually:
```bash
docker exec -it mqtt-broker mosquitto_pub -t throttle -m 50
```

---

## 8. Project structure

```
carrera-evo/
├── app/                  Screens (file-based routing via expo-router)
│   └── (tabs)/
│       ├── drive/        Throttle slider + live MQTT publishing
│       ├── lap/          Lap detail / replay view
│       └── settings/     MQTT host & topic configuration
├── components/           Reusable UI (throttle control, charts, ...)
├── hooks/                React hooks (useMqtt, useMqttStatus, ...)
├── lib/
│   └── mqttClient.ts     Single MQTT connection used app-wide
├── mqtt-mosquitto/       Docker Compose setup for the local broker
├── assets/               Icons, images
└── app.json              Expo configuration
```

---

## 9. Common problems

**"Verbindung fehlgeschlagen" / "Getrennt"**
- Phone and laptop on the same Wi-Fi? (Many school networks isolate clients — try a hotspot.)
- Is the broker running? `docker compose ps` inside `mqtt-mosquitto/`.
- Did you enter the laptop IP, not `localhost`?
- Firewall blocking port 9001? (Allow it for incoming connections.)

**"xcodebuild exited with error code 65" / Pods errors after pulling**
- Native folders may be stale. Regenerate them:
  ```bash
  npx expo prebuild --clean
  npx expo run:ios   # or run:android
  ```

**Build is fine but the tab icons are missing**
- You're probably on iOS < 26 — that branch uses fallback icons. Anything else, see the dev-server logs.

**App can't find Metro / "Could not connect to development server"**
- Make sure `npx expo start` is running.
- On a physical device, both phone and laptop must be on the same network.

> **Tip:** If you get stuck, agentic AI tools (e.g. Claude Code, Cursor, GitHub Copilot Agent) can be very helpful for troubleshooting build errors, dependency issues, and config problems. Paste the error message and let the agent investigate the project.

---

## 10. Useful commands

| Command | What it does |
|---|---|
| `npm install` | Install JS dependencies |
| `npx expo start` | Start the dev server (JS only) |
| `npx expo run:ios` | Build & run on iOS |
| `npx expo run:android` | Build & run on Android |
| `npx expo prebuild --clean` | Regenerate native `ios/` and `android/` folders |
| `docker compose up -d` *(in mqtt-mosquitto/)* | Start the MQTT broker |
| `docker compose down` *(in mqtt-mosquitto/)* | Stop the broker |
| `npx expo-doctor` | Sanity-check the project setup |

---

## Tech stack

- **Expo SDK 55** / React Native 0.83 / React 19.2
- **expo-router** for navigation (file-based)
- **paho-mqtt** for MQTT-over-WebSocket
- **Eclipse Mosquitto 2.0** (Docker) as the broker
