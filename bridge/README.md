# 🔌 Hardware Bridge (Serial-to-HTTP Ingestion Gateway)

The Hardware Bridge connects microcontrollers (such as Arduino Uno or ESP32) to the FastAPI backend over USB Serial. It listens for newline-delimited JSON telemetry packets and forwards them to the ingestion endpoint:
`POST /api/sensors/ingest`.

## 📦 Requirements
Install Python dependencies:
```bash
pip install -r requirements.txt
```

## 🚀 Usage

### 1. Auto-Detect COM Port
Run the bridge script directly. It will scan available serial ports, detect connected Arduino/ESP32 devices, and establish a serial listener:
```bash
python hardware_bridge.py
```

### 2. Specify Port Manually
If auto-detection fails or you have multiple devices connected:
```bash
python hardware_bridge.py --port COM3
```

### 3. Custom Baud Rate and Backend URL
```bash
python hardware_bridge.py --port COM3 --baud 9600 --url http://localhost:8000
```

## 📡 Expected Serial Packet Format
The Arduino/ESP32 should transmit valid JSON objects terminated by a newline:
```json
{
  "rover_id": "ROVER-01",
  "zone_code": "ZONE-01",
  "methane": 412.5,
  "co": 32.1,
  "temperature": 26.8,
  "humidity": 64.2,
  "vibration": 0.18,
  "water": false,
  "battery": 88.5
}
```
