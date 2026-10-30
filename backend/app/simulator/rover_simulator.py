import asyncio
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.rover import Rover
from app.models.mine import Mine, Zone
from app.models.patrol import Patrol
from app.models.sensor import SensorReading
from app.models.ml import MLPrediction
from app.ml.predictor import predictor
from app.services.rule_engine import rule_engine
from app.services.alert_service import alert_service
from app.services.patrol_service import patrol_service
from app.websocket.manager import ws_manager

class HardwareSimulator:
    def __init__(self):
        self.is_running = True
        self.mode = "NORMAL" # 'NORMAL', 'METHANE_RISING', 'MULTI_SENSOR_ANOMALY', 'CRITICAL_EMERGENCY', 'COMM_LOST', 'LOW_BATTERY'
        self.speed_multiplier = 1.0
        self.step_count = 0
        self.rover_code = "ROVER-01"
        self.current_zone_code = "ENTRY"
        self.zone_sequence = ["ENTRY", "ZONE-01", "ZONE-02", "ZONE-03", "ZONE-04"]
        self.zone_index = 0
        self.patrol_direction = 1 # 1 = forward, -1 = returning
        self.battery_level = 94.0
        self.last_broadcast_time = None
        self.active_patrol_id = None
        self.task = None

        # Telemetry sliding windows for ML (last 5 readings)
        self.ch4_window = [430.0] * 5
        self.co_window = [35.0] * 5
        self.temp_window = [27.5] * 5
        self.hum_window = [65.0] * 5
        self.vib_window = [0.22] * 5
        self.water_window = [0] * 5
        self.batt_window = [94.0] * 5
        self.comm_health = 1.0

    def set_scenario(self, scenario: str):
        self.mode = scenario
        print(f"[SIMULATOR] Switched scenario to: {self.mode}")

    def reset_to_normal(self):
        self.mode = "NORMAL"
        self.ch4_window = [430.0] * 5
        self.co_window = [35.0] * 5
        self.temp_window = [27.5] * 5
        self.hum_window = [65.0] * 5
        self.vib_window = [0.22] * 5
        self.water_window = [0] * 5
        self.comm_health = 1.0

    async def start(self):
        self.is_running = True
        if not self.task or self.task.done():
            self.task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()

    async def _run_loop(self):
        while self.is_running:
            try:
                await self._step()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SIMULATOR ERROR] {e}")
            await asyncio.sleep(2.0 / max(0.2, self.speed_multiplier))

    async def _step(self):
        self.step_count += 1
        db: Session = SessionLocal()
        try:
            rover = db.query(Rover).filter(Rover.code == self.rover_code).first()
            if not rover:
                return

            # Advance rover zone along route every 4 steps
            if self.step_count % 4 == 0:
                self.zone_index += self.patrol_direction
                if self.zone_index >= len(self.zone_sequence):
                    self.zone_index = len(self.zone_sequence) - 2
                    self.patrol_direction = -1
                elif self.zone_index < 0:
                    self.zone_index = 0
                    self.patrol_direction = 1

            self.current_zone_code = self.zone_sequence[self.zone_index]
            zone = db.query(Zone).filter(
                Zone.mine_id == rover.mine_id,
                Zone.code == self.current_zone_code
            ).first()
            if zone:
                rover.current_zone_id = zone.id

            # Generate sensor readings based on mode
            readings = self._generate_readings_for_current_state()
            
            # Update windows
            self.ch4_window.pop(0)
            self.ch4_window.append(readings["methane"])
            self.co_window.pop(0)
            self.co_window.append(readings["co"])
            self.temp_window.pop(0)
            self.temp_window.append(readings["temperature"])
            self.hum_window.pop(0)
            self.hum_window.append(readings["humidity"])
            self.vib_window.pop(0)
            self.vib_window.append(readings["vibration"])
            self.water_window.pop(0)
            self.water_window.append(1 if readings["water"] else 0)
            self.batt_window.pop(0)
            self.batt_window.append(readings["battery"])
            self.battery_level = readings["battery"]
            rover.battery_level = self.battery_level

            # 1. LAYER 1: Rule Engine Evaluation
            rule_violations = rule_engine.evaluate(
                methane=readings["methane"],
                co=readings["co"],
                temperature=readings["temperature"],
                humidity=readings["humidity"],
                water=readings["water"],
                vibration=readings["vibration"],
                battery=readings["battery"],
                zone=zone
            )
            rule_status = "NORMAL"
            if any(v.severity == "CRITICAL" for v in rule_violations):
                rule_status = "CRITICAL"
            elif any(v.severity == "WARNING" for v in rule_violations):
                rule_status = "WARNING"

            # 2. LAYER 2: Machine Learning Prediction & Explainability
            ml_result = predictor.predict(
                ch4_window=self.ch4_window,
                co_window=self.co_window,
                temp_window=self.temp_window,
                hum_window=self.hum_window,
                vib_window=self.vib_window,
                water_window=self.water_window,
                batt_window=self.batt_window,
                comm_health=self.comm_health
            )
            ml_status = ml_result["prediction"]
            risk_score = ml_result["risk_score"]

            # Composite Final Assessment: Rule engine critical ALWAYS forces critical
            if rule_status == "CRITICAL" or ml_status == "CRITICAL":
                final_assessment = "CRITICAL"
                rover.hazard_status = "CRITICAL"
            elif rule_status == "WARNING" or ml_status == "ANOMALOUS":
                final_assessment = "ANOMALOUS"
                rover.hazard_status = "ANOMALOUS"
            else:
                final_assessment = "NORMAL"
                rover.hazard_status = "NORMAL"

            # Check communication state
            if self.mode == "COMM_LOST":
                rover.status = "OFFLINE"
                self.comm_health = 0.0
            else:
                rover.last_ping_at = datetime.utcnow()
                if rover.status == "OFFLINE":
                    rover.status = "PATROLLING"

            db.commit()

            # Record ML prediction
            ml_pred_record = MLPrediction(
                rover_id=rover.id,
                zone_id=zone.id if zone else None,
                prediction=ml_status,
                confidence=ml_result["confidence"],
                risk_score=risk_score,
                features=ml_result["features"],
                explanations=ml_result["explanations"],
                timestamp=datetime.utcnow()
            )
            db.add(ml_pred_record)

            # Record Sensor Reading
            sensor_record = SensorReading(
                rover_id=rover.id,
                mine_id=rover.mine_id,
                zone_id=zone.id if zone else 1,
                methane_ppm=readings["methane"],
                co_ppm=readings["co"],
                temperature_c=readings["temperature"],
                humidity_pct=readings["humidity"],
                water_detected=readings["water"],
                vibration_g=readings["vibration"],
                battery_pct=readings["battery"],
                rule_status=rule_status,
                ml_status=ml_status,
                risk_score=risk_score,
                timestamp=datetime.utcnow()
            )
            db.add(sensor_record)
            db.commit()

            # Check if active patrol exists (only log events if user explicitly started a patrol)
            active_patrol = db.query(Patrol).filter(
                Patrol.rover_id == rover.id,
                Patrol.final_status == "IN_PROGRESS"
            ).first()
            if active_patrol:
                self.active_patrol_id = active_patrol.id
                # Log patrol checkpoint / anomaly
                if self.step_count % 4 == 0 and zone:
                    patrol_service.log_event(
                        db=db,
                        patrol_id=active_patrol.id,
                        event_type="CHECKPOINT",
                        description=f"Rover arrived at {zone.name} ({zone.code}). Telemetry nominal.",
                        zone_id=zone.id,
                        risk_score=risk_score,
                        sensor_snapshot=readings
                    )
            else:
                self.active_patrol_id = None


            # Process Rule Violations into Alerts
            for viol in rule_violations:
                new_alert = alert_service.create_or_update_alert(
                    db=db,
                    rover_id=rover.id,
                    mine_id=rover.mine_id,
                    zone_id=zone.id if zone else 1,
                    hazard_type=viol.hazard_type,
                    severity=viol.severity,
                    title=viol.title,
                    description=viol.description,
                    risk_score=risk_score,
                    contributing_factors=viol.factors,
                    patrol_id=active_patrol.id
                )
                if new_alert:
                    # Log to patrol timeline
                    patrol_service.log_event(
                        db=db,
                        patrol_id=active_patrol.id,
                        event_type="ALERT_TRIGGERED" if viol.severity == "CRITICAL" else "ANOMALY",
                        description=f"Safety Alert: {viol.title}",
                        zone_id=zone.id if zone else None,
                        risk_score=risk_score,
                        sensor_snapshot=readings
                    )
                    # Broadcast Alert WebSocket event
                    await ws_manager.broadcast("alert_created", {
                        "id": new_alert.id,
                        "title": new_alert.title,
                        "severity": new_alert.severity,
                        "hazard_type": new_alert.hazard_type,
                        "zone_code": self.current_zone_code,
                        "zone_name": zone.name if zone else "Unknown",
                        "risk_score": risk_score,
                        "created_at": new_alert.created_at.isoformat()
                    })

            self.last_broadcast_time = datetime.utcnow()

            # WebSocket Telemetry Broadcast
            telemetry_payload = {
                "rover_code": rover.code,
                "zone_code": self.current_zone_code,
                "zone_name": zone.name if zone else "Entry Tunnel",
                "zone_id": zone.id if zone else 1,
                "battery": readings["battery"],
                "status": rover.status,
                "hazard_status": final_assessment,
                "risk_score": risk_score,
                "readings": {
                    "methane": readings["methane"],
                    "co": readings["co"],
                    "temperature": readings["temperature"],
                    "humidity": readings["humidity"],
                    "water": readings["water"],
                    "vibration": readings["vibration"],
                    "battery": readings["battery"]
                },
                "ml_prediction": {
                    "prediction": ml_status,
                    "confidence": ml_result["confidence"],
                    "explanations": ml_result["explanations"],
                    "probabilities": ml_result["probabilities"]
                },
                "rule_status": rule_status,
                "is_emergency": (final_assessment == "CRITICAL"),
                "timestamp": self.last_broadcast_time.isoformat()
            }
            await ws_manager.broadcast("sensor_update", telemetry_payload)

            if final_assessment == "CRITICAL":
                await ws_manager.broadcast("emergency_mode", {
                    "active": True,
                    "rover_code": rover.code,
                    "zone_code": self.current_zone_code,
                    "zone_name": zone.name if zone else "Tunnel Zone",
                    "risk_score": risk_score,
                    "hazard": "CRITICAL HAZARD DETECTED",
                    "timestamp": self.last_broadcast_time.isoformat()
                })

        finally:
            db.close()

    def _generate_readings_for_current_state(self) -> Dict[str, Any]:
        """
        Synthesizes realistic physical telemetry according to scenario mode.
        """
        # Slow baseline battery decay
        battery = max(5.0, self.battery_level - random.uniform(0.01, 0.05))

        if self.mode == "NORMAL":
            methane = random.uniform(410.0, 480.0)
            co = random.uniform(25.0, 45.0)
            temperature = random.uniform(25.0, 30.0)
            humidity = random.uniform(55.0, 70.0)
            water = False
            vibration = random.uniform(0.12, 0.35)
        elif self.mode == "METHANE_RISING":
            # Gradient climb up to 720 ppm
            last_ch4 = self.ch4_window[-1]
            methane = min(780.0, last_ch4 + random.uniform(25.0, 55.0))
            co = random.uniform(35.0, 60.0)
            temperature = random.uniform(28.0, 32.5)
            humidity = random.uniform(60.0, 75.0)
            water = False
            vibration = random.uniform(0.20, 0.45)
        elif self.mode == "MULTI_SENSOR_ANOMALY":
            last_ch4 = self.ch4_window[-1]
            last_co = self.co_window[-1]
            methane = min(880.0, last_ch4 + random.uniform(30.0, 60.0))
            co = min(120.0, last_co + random.uniform(8.0, 18.0))
            temperature = min(38.0, self.temp_window[-1] + random.uniform(0.5, 1.2))
            humidity = random.uniform(70.0, 85.0)
            water = (self.step_count % 3 == 0)
            vibration = random.uniform(0.35, 0.65)
        elif self.mode == "CRITICAL_EMERGENCY":
            last_ch4 = self.ch4_window[-1]
            methane = min(1750.0, max(1150.0, last_ch4 + random.uniform(60.0, 120.0)))
            co = random.uniform(160.0, 240.0)
            temperature = random.uniform(42.0, 48.5)
            humidity = random.uniform(75.0, 92.0)
            water = True
            vibration = random.uniform(1.15, 2.45) # Roof / seismic shock
        elif self.mode == "LOW_BATTERY":
            battery = max(4.0, min(14.0, self.battery_level - 1.5))
            methane = random.uniform(420.0, 470.0)
            co = random.uniform(25.0, 45.0)
            temperature = random.uniform(25.0, 29.0)
            humidity = random.uniform(55.0, 68.0)
            water = False
            vibration = random.uniform(0.12, 0.30)
        elif self.mode == "COMM_LOST":
            methane = self.ch4_window[-1]
            co = self.co_window[-1]
            temperature = self.temp_window[-1]
            humidity = self.hum_window[-1]
            water = False
            vibration = self.vib_window[-1]
        else:
            methane = random.uniform(420.0, 480.0)
            co = random.uniform(25.0, 45.0)
            temperature = random.uniform(25.0, 30.0)
            humidity = random.uniform(55.0, 70.0)
            water = False
            vibration = random.uniform(0.15, 0.35)

        return {
            "methane": round(methane, 1),
            "co": round(co, 1),
            "temperature": round(temperature, 1),
            "humidity": round(humidity, 1),
            "water": water,
            "vibration": round(vibration, 2),
            "battery": round(battery, 1)
        }

simulator = HardwareSimulator()
