# 🚗 ESP32 Bluetooth Motor Control Firmware

Firmware for the ESP32 microcontroller controlling the rover chassis locomotion via an L298N dual H-bridge motor driver over Bluetooth Serial (`BluetoothSerial.h`).

## ⚙️ Pin Configuration

| ESP32 Pin | L298N Pin | Function |
| :--- | :--- | :--- |
| `GPIO 26` | `IN1` | Left Motor Direction 1 |
| `GPIO 27` | `IN2` | Left Motor Direction 2 |
| `GPIO 18` | `IN3` | Right Motor Direction 1 |
| `GPIO 19` | `IN4` | Right Motor Direction 2 |
| `GPIO 25` | `ENA` | Left Motor PWM Speed Control (5 kHz, 8-bit) |
| `GPIO 32` | `ENB` | Right Motor PWM Speed Control (5 kHz, 8-bit) |

## 📶 Bluetooth Commands

Connect to Bluetooth device **`ESP32_Car`** using any serial Bluetooth terminal app:
- `'F'` / `'f'` : Move Forward
- `'B'` / `'b'` : Move Backward
- `'L'` / `'l'` : Turn Left
- `'R'` / `'r'` : Turn Right
- `'S'` / `'s'` : Stop Motors

## 🛠️ Flashing Instructions
1. Open `esp32_motor_control.ino` in the Arduino IDE.
2. Select Board: **DOIT ESP32 DEVKIT V1** (or compatible ESP32 board).
3. Connect ESP32 via USB and select the appropriate COM port.
4. Click **Upload**.
