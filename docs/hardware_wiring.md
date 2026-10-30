# ⚡ Hardware Wiring & Schematic Specification

This document details the circuit connections and pin assignments for the **Mine Minds Rover** embedded subsystems: the sensor telemetry module (Arduino Uno) and the motor drive subsystem (ESP32).

---

## 1. Sensor Telemetry Subsystem (Arduino Uno)

```
       +-----------------------+
       |      Arduino Uno      |
       |                       |
       |  A0 <---- MQ-2 (AOUT) |  Methane & Combustible Gas
       |  A1 <---- MQ-7 (AOUT) |  Carbon Monoxide (CO)
       |  A2 <---- Voltage Div |  Battery Level Monitor
       |   2 <---- DHT11 (DATA)|  Temperature & Humidity
       |   3 <---- SW-420 (DO) |  Structural Vibration Sensor
       |   4 <---- Water (DO)  |  Sub-floor Flooding Detector
       |                       |
       | 5V  ----> VCC Bus     |
       | GND ----> Ground Bus  |
       +-----------------------+
```

### Pin Allocation Table

| Component | Signal | Arduino Pin | Operating Voltage | Function |
| :--- | :--- | :--- | :--- | :--- |
| **MQ-2** | Analog | `A0` | 5.0V | Gas concentration voltage ($0 - 5\text{V}$) |
| **MQ-7** | Analog | `A1` | 5.0V | Carbon monoxide concentration voltage |
| **DHT11 / 22** | Digital Single-Wire | `D2` | 3.3V - 5.0V | Serial telemetry for temperature & relative humidity |
| **SW-420** | Digital | `D3` | 3.3V - 5.0V | High state on vibration shock detection |
| **Rain Detector** | Digital | `D4` | 3.3V - 5.0V | Active LOW water detection bridge |
| **Voltage Divider** | Analog | `A2` | $0 - 5\text{V}$ | 10kΩ + 4.7kΩ divider network to monitor battery |

---

## 2. Mobility & Locomotion Subsystem (ESP32 + L298N)

```
       +----------------------+         +-----------------------+
       |   DOIT ESP32 DEVKIT  |         |   L298N Dual H-Bridge |
       |                      |         |                       |
       | GPIO 26 ------------>--------->| IN1 (Left Motor Fwd)  |
       | GPIO 27 ------------>--------->| IN2 (Left Motor Rev)  |
       | GPIO 18 ------------>--------->| IN3 (Right Motor Fwd) |
       | GPIO 19 ------------>--------->| IN4 (Right Motor Rev) |
       | GPIO 25 (PWM 5kHz) ->--------->| ENA (Left Speed)      |
       | GPIO 32 (PWM 5kHz) ->--------->| ENB (Right Speed)     |
       |                      |         |                       |
       | GND ----------------->--------->| GND (Common Ground)   |
       +----------------------+         +-----------------------+
```

### Power Distribution
- **Logic Power (ESP32)**: 5V regulated USB or 3.3V onboard LDO.
- **Motor Power (L298N)**: 7.4V - 11.1V 2S/3S LiPo battery connected directly to the L298N $V_{\text{motor}}$ terminal.
- **Common Ground**: All microcontrollers, motor drivers, and sensors must share a common GND reference.
