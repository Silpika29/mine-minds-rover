# 📡 Arduino Sensor Telemetry Node

Firmware for the Arduino Uno / Nano sensor interface module. Reads physical gas, climate, vibration, and flood sensors, serializes the measurements into JSON format, and outputs packets over USB Serial every 2 seconds.

## 🔌 Sensor Pinout & Wiring

| Sensor / Module | Physical Parameter | Arduino Pin | Signal Type | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **MQ-2** | Methane ($CH_4$) & Flammable Gas | `A0` | Analog Input | Clean-air baseline calibrated |
| **MQ-7** | Carbon Monoxide ($CO$) | `A1` | Analog Input | High-sensitivity detection |
| **DHT11 / DHT22** | Ambient Temperature & Humidity | `D2` | Digital I/O | Standard single-wire bus |
| **SW-420** | Structural Ground Vibration | `D3` | Digital Input | HIGH on shock / roof movement |
| **Rain / Probe** | Sub-floor Water Detection | `D4` | Digital Input | LOW indicates water bridge |
| **Voltage Divider** | Rover Battery Level | `A2` | Analog Input | 10kΩ + 4.7kΩ divider network |

## 📦 Required Libraries
Install the following via the Arduino IDE Library Manager:
- `DHT sensor library` by Adafruit
- `Adafruit Unified Sensor` by Adafruit
- `ArduinoJson` by Benoit Blanchon (v6.x)

## ⚡ Flashing
1. Open `arduino_sensor_node.ino` in Arduino IDE.
2. Select Board: **Arduino Uno** (or Nano).
3. Connect via USB and click **Upload**.
4. Telemetry streams at **9600 baud** in newline-delimited JSON.
