/*
 * ============================================================
 * MINING SAFETY ROVER - Arduino Uno Sensor Interface
 * ============================================================
 * Reads physical mine safety sensors and outputs a JSON 
 * telemetry packet over USB Serial every 2 seconds.
 * 
 * The Python hardware_bridge.py on the PC picks up this JSON
 * and forwards it to the FastAPI backend at:
 *   POST http://localhost:8000/api/sensors/ingest
 *
 * ============================================================
 * WIRING GUIDE (change pin numbers below if yours differ)
 * ============================================================
 *
 *  SENSOR          MODULE       ARDUINO PIN   NOTES
 * -------------------------------------------------------
 *  Methane/LPG     MQ-2         A0            Analog
 *  Carbon Monoxide MQ-7         A1            Analog
 *  Temperature &   DHT11        D2            Digital (3.3-5V)
 *   Humidity       DHT22        D2            Same pin, just change DHT_TYPE
 *  Vibration       SW-420       D3            Digital (HIGH = vibrating)
 *  Water Detection Rain Sensor  D4            Digital (LOW = water detected)
 *  Battery Level   Voltage Div  A2            10K + 4.7K voltage divider
 *                               (from battery + to GND, read mid-point)
 *
 * ============================================================
 * DEPENDENCIES - install via Arduino IDE Library Manager:
 *   "DHT sensor library" by Adafruit
 *   "Adafruit Unified Sensor" by Adafruit
 *   "ArduinoJson" by Benoit Blanchon (v6.x)
 * ============================================================
 */

#include <DHT.h>
#include <ArduinoJson.h>

// ──────────────────────────────────────────────────────
// PIN CONFIGURATION  (change these to match your wiring)
// ──────────────────────────────────────────────────────
#define MQ2_PIN         A0   // MQ-2 analog output (methane / LPG)
#define MQ7_PIN         A1   // MQ-7 analog output (carbon monoxide)
#define DHT_PIN         2    // DHT11 or DHT22 data pin
#define DHT_TYPE        DHT11 // Change to DHT22 if using DHT22
#define VIBRATION_PIN   3    // SW-420 digital output (HIGH when vibrating)
#define WATER_PIN       4    // Rain sensor digital output (LOW = water present)
#define BATTERY_PIN     A2   // Voltage divider mid-point

// ──────────────────────────────────────────────────────
// CALIBRATION CONSTANTS
// ──────────────────────────────────────────────────────
#define MQ2_PPM_MAX     2000.0
#define MQ2_PPM_MIN     0.0
#define MQ2_BASELINE    300.0    // Clean-air baseline (ppm)

#define MQ7_PPM_MAX     1000.0
#define MQ7_PPM_MIN     0.0
#define MQ7_BASELINE    10.0

#define VIB_SAMPLE_MS   500      // Sample vibration for 500ms

#define R1              10000.0  // Upper resistor in voltage divider (Ohms)
#define R2              4700.0   // Lower resistor in voltage divider (Ohms)
#define VREF            5.0      // Arduino 5V reference
#define BATTERY_MAX_V   4.2      // 100% battery voltage
#define BATTERY_MIN_V   3.0      // 0% battery voltage

// ──────────────────────────────────────────────────────
// ROVER CONFIGURATION
// ──────────────────────────────────────────────────────
#define ROVER_ID        "ROVER-01"
#define ZONE_CODE       "ZONE-01"
#define SEND_INTERVAL   2000        // ms between readings

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }

  dht.begin();
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(WATER_PIN, INPUT_PULLUP);

  Serial.println("// MINING SAFETY ROVER - Sensor Init...");
  Serial.println("// Warming up sensors (20s)...");
  delay(20000);  // MQ sensor warm-up -- reduce to 1000 for quick testing
  Serial.println("// READY - Starting telemetry stream");
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    sendTelemetry();
  }
}

void sendTelemetry() {
  // ── 1. READ METHANE (MQ-2) ──
  int mq2Raw = analogRead(MQ2_PIN);
  float methane = mapFloat(mq2Raw, 0, 1023, MQ2_PPM_MIN + MQ2_BASELINE, MQ2_PPM_MAX + MQ2_BASELINE);
  methane = max(0.0f, methane);

  // ── 2. READ CARBON MONOXIDE (MQ-7) ──
  int mq7Raw = analogRead(MQ7_PIN);
  float co = mapFloat(mq7Raw, 0, 1023, MQ7_PPM_MIN + MQ7_BASELINE, MQ7_PPM_MAX + MQ7_BASELINE);
  co = max(0.0f, co);

  // ── 3. READ TEMPERATURE + HUMIDITY (DHT) ──
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (isnan(humidity))    humidity    = 0.0;
  if (isnan(temperature)) temperature = 0.0;

  // ── 4. READ VIBRATION (SW-420) ──
  // Count pulses over VIB_SAMPLE_MS to estimate intensity
  unsigned long vibStart = millis();
  int vibCount = 0;
  while (millis() - vibStart < VIB_SAMPLE_MS) {
    if (digitalRead(VIBRATION_PIN) == HIGH) vibCount++;
    delayMicroseconds(500);
  }
  float vibration = constrain(mapFloat(vibCount, 0, 200, 0.0, 2.0), 0.0, 3.0);

  // ── 5. READ WATER SENSOR ──
  bool water = (digitalRead(WATER_PIN) == LOW);

  // ── 6. READ BATTERY LEVEL ──
  int battRaw = analogRead(BATTERY_PIN);
  float battVoltage = battRaw * (VREF / 1023.0) * ((R1 + R2) / R2);
  float battery = mapFloat(battVoltage, BATTERY_MIN_V, BATTERY_MAX_V, 0.0, 100.0);
  battery = constrain(battery, 0.0, 100.0);

  // ── 7. BUILD + SEND JSON ──
  StaticJsonDocument<256> doc;
  doc["rover_id"]    = ROVER_ID;
  doc["zone_code"]   = ZONE_CODE;
  doc["methane"]     = round2(methane);
  doc["co"]          = round2(co);
  doc["temperature"] = round2(temperature);
  doc["humidity"]    = round2(humidity);
  doc["water"]       = water;
  doc["vibration"]   = round2(vibration);
  doc["battery"]     = round2(battery);

  serializeJson(doc, Serial);
  Serial.println();  // Newline is the packet delimiter
}

// ── Helpers ──
float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float round2(float val) {
  return round(val * 100.0) / 100.0;
}
