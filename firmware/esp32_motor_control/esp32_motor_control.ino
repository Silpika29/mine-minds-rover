#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// ===============================
// L298N MOTOR DRIVER PINS
// ===============================

#define IN1 26
#define IN2 27
#define IN3 18
#define IN4 19

#define ENA 25
#define ENB 32

// Motor speed: 0 - 255
int motorSpeed = 255;


// ===============================
// SETUP
// ===============================

void setup() {

  Serial.begin(115200);

  // Motor direction pins
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // PWM for L298N
  ledcAttach(ENA, 5000, 8);
  ledcAttach(ENB, 5000, 8);

  // Start with motors stopped
  stopCar();

  // Start Bluetooth
  SerialBT.begin("ESP32_Car");

  Serial.println("--------------------------------");
  Serial.println("ESP32 Mine Rover Started");
  Serial.println("Bluetooth: ESP32_Car");
  Serial.println("--------------------------------");
}


// ===============================
// MAIN LOOP
// ===============================

void loop() {

  if (SerialBT.available()) {

    char command = SerialBT.read();

    Serial.print("Received command: ");
    Serial.println(command);

    if (command == 'F' || command == 'f') {

      forward();

    }

    else if (command == 'B' || command == 'b') {

      backward();

    }

    else if (command == 'L' || command == 'l') {

      turnLeft();

    }

    else if (command == 'R' || command == 'r') {

      turnRight();

    }

    else if (command == 'S' || command == 's') {

      stopCar();

    }
  }
}


// ===============================
// FORWARD
// ===============================

void forward() {

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, motorSpeed);
  ledcWrite(ENB, motorSpeed);

  Serial.println("FORWARD");
}


// ===============================
// BACKWARD
// ===============================

void backward() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, motorSpeed);
  ledcWrite(ENB, motorSpeed);

  Serial.println("BACKWARD");
}


// ===============================
// TURN LEFT
// ===============================

void turnLeft() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, motorSpeed);
  ledcWrite(ENB, motorSpeed);

  Serial.println("LEFT");
}


// ===============================
// TURN RIGHT
// ===============================

void turnRight() {

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, motorSpeed);
  ledcWrite(ENB, motorSpeed);

  Serial.println("RIGHT");
}


// ===============================
// STOP
// ===============================

void stopCar() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);

  Serial.println("STOP");
}