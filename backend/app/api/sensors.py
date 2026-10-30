from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db
from app.models.sensor import SensorReading
from app.models.rover import Rover
from app.models.mine import Mine, Zone
from app.models.patrol import Patrol
from app.schemas.sensor import SensorPayload, SensorReadingResponse, SensorsOverviewResponse, SensorLatestData
from app.services.rule_engine import rule_engine
from app.services.alert_service import alert_service
from app.services.patrol_service import patrol_service
from app.ml.predictor import predictor
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/sensors", tags=["Sensors & Telemetry"])

@router.post("/ingest", response_model=Dict[str, Any])
async def ingest_hardware_sensor_data(payload: SensorPayload, db: Session = Depends(get_db)):
    """
    HARDWARE INTEGRATION ENDPOINT:
    Accepts raw or LoRa Gateway-relayed JSON telemetry packets directly from 
    physical ESP32 rovers or field hardware without modifying application logic.
    """
    rover = db.query(Rover).filter(Rover.code == payload.rover_id).first()
    if not rover:
        raise HTTPException(status_code=404, detail=f"Rover {payload.rover_id} not registered")

    zone = db.query(Zone).filter(Zone.code == payload.zone_code, Zone.mine_id == rover.mine_id).first()
    if not zone:
        zone = db.query(Zone).filter(Zone.mine_id == rover.mine_id).first()

    zone_id = zone.id if zone else 1
    rover.current_zone_id = zone_id
    rover.battery_level = payload.battery
    rover.last_ping_at = datetime.utcnow()

    # 1. LAYER 1: Rule Engine
    rule_violations = rule_engine.evaluate(
        methane=payload.methane,
        co=payload.co,
        temperature=payload.temperature,
        humidity=payload.humidity,
        water=payload.water,
        vibration=payload.vibration,
        battery=payload.battery,
        zone=zone
    )
    rule_status = "NORMAL"
    if any(v.severity == "CRITICAL" for v in rule_violations):
        rule_status = "CRITICAL"
    elif any(v.severity == "WARNING" for v in rule_violations):
        rule_status = "WARNING"

    # 2. Retrieve recent 5 readings for ML sliding window
    recent = db.query(SensorReading).filter(
        SensorReading.rover_id == rover.id
    ).order_by(desc(SensorReading.timestamp)).limit(4).all()

    ch4_win = [r.methane_ppm for r in reversed(recent)] + [payload.methane]
    co_win = [r.co_ppm for r in reversed(recent)] + [payload.co]
    temp_win = [r.temperature_c for r in reversed(recent)] + [payload.temperature]
    hum_win = [r.humidity_pct for r in reversed(recent)] + [payload.humidity]
    vib_win = [r.vibration_g for r in reversed(recent)] + [payload.vibration]
    water_win = [1 if r.water_detected else 0 for r in reversed(recent)] + [1 if payload.water else 0]
    batt_win = [r.battery_pct for r in reversed(recent)] + [payload.battery]

    # Pad if fewer than 5
    while len(ch4_win) < 5:
        ch4_win.insert(0, ch4_win[0] if ch4_win else payload.methane)
        co_win.insert(0, co_win[0] if co_win else payload.co)
        temp_win.insert(0, temp_win[0] if temp_win else payload.temperature)
        hum_win.insert(0, hum_win[0] if hum_win else payload.humidity)
        vib_win.insert(0, vib_win[0] if vib_win else payload.vibration)
        water_win.insert(0, 0)
        batt_win.insert(0, batt_win[0] if batt_win else payload.battery)

    # 3. LAYER 2: ML Prediction & Explainability
    ml_result = predictor.predict(
        ch4_window=ch4_win,
        co_window=co_win,
        temp_window=temp_win,
        hum_window=hum_win,
        vib_window=vib_win,
        water_window=water_win,
        batt_window=batt_win
    )
    ml_status = ml_result["prediction"]
    risk_score = ml_result["risk_score"]

    if rule_status == "CRITICAL" or ml_status == "CRITICAL":
        final_assessment = "CRITICAL"
        rover.hazard_status = "CRITICAL"
    elif rule_status == "WARNING" or ml_status == "ANOMALOUS":
        final_assessment = "ANOMALOUS"
        rover.hazard_status = "ANOMALOUS"
    else:
        final_assessment = "NORMAL"
        rover.hazard_status = "NORMAL"

    db.commit()

    # Save Sensor Reading
    reading = SensorReading(
        rover_id=rover.id,
        mine_id=rover.mine_id,
        zone_id=zone_id,
        methane_ppm=payload.methane,
        co_ppm=payload.co,
        temperature_c=payload.temperature,
        humidity_pct=payload.humidity,
        water_detected=payload.water,
        vibration_g=payload.vibration,
        battery_pct=payload.battery,
        rule_status=rule_status,
        ml_status=ml_status,
        risk_score=risk_score,
        timestamp=payload.timestamp or datetime.utcnow()
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Process alerts
    for viol in rule_violations:
        alert = alert_service.create_or_update_alert(
            db=db,
            rover_id=rover.id,
            mine_id=rover.mine_id,
            zone_id=zone_id,
            hazard_type=viol.hazard_type,
            severity=viol.severity,
            title=viol.title,
            description=viol.description,
            risk_score=risk_score,
            contributing_factors=viol.factors
        )
        if alert:
            await ws_manager.broadcast("alert_created", {
                "id": alert.id,
                "title": alert.title,
                "severity": alert.severity,
                "zone_code": payload.zone_code,
                "risk_score": risk_score
            })

    # Broadcast Live Telemetry
    await ws_manager.broadcast("sensor_update", {
        "rover_code": rover.code,
        "zone_code": payload.zone_code,
        "zone_name": zone.name if zone else "Unknown",
        "battery": payload.battery,
        "hazard_status": final_assessment,
        "risk_score": risk_score,
        "readings": {
            "methane": payload.methane,
            "co": payload.co,
            "temperature": payload.temperature,
            "humidity": payload.humidity,
            "water": payload.water,
            "vibration": payload.vibration,
            "battery": payload.battery
        },
        "ml_prediction": ml_result,
        "timestamp": reading.timestamp.isoformat()
    })

    return {
        "status": "PROCESSED",
        "reading_id": reading.id,
        "rule_status": rule_status,
        "ml_status": ml_status,
        "risk_score": risk_score,
        "final_assessment": final_assessment
    }

@router.get("/latest", response_model=SensorsOverviewResponse)
def get_latest_sensor_overview(rover_code: str = "ROVER-01", db: Session = Depends(get_db)):
    rover = db.query(Rover).filter(Rover.code == rover_code).first()
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")

    recent_readings = db.query(SensorReading).filter(
        SensorReading.rover_id == rover.id
    ).order_by(desc(SensorReading.timestamp)).limit(15).all()

    # Check if latest reading is fresh (within 30 seconds)
    is_fresh = False
    if recent_readings:
        delta = datetime.utcnow() - recent_readings[0].timestamp
        if delta.total_seconds() < 30:
            is_fresh = True

    if not recent_readings or not is_fresh:
        return {
            "rover_code": rover.code,
            "zone_code": "ENTRY",
            "zone_name": "Main Mine Portal",
            "battery_pct": None,
            "is_connected": False,
            "overall_status": "OFFLINE",
            "risk_score": 0.0,
            "last_ping": rover.last_ping_at,
            "methane": None,
            "co": None,
            "temperature": None,
            "humidity": None,
            "vibration": None,
            "water": None,
            "battery": None,
        }

    latest = recent_readings[0]
    prev = recent_readings[1] if len(recent_readings) > 1 else latest
    zone = db.query(Zone).filter(Zone.id == latest.zone_id).first()

    def calc_trend(curr: float, prev_val: float, threshold: float = 0.5) -> str:
        diff = curr - prev_val
        if diff > threshold:
            return "RISING"
        elif diff < -threshold:
            return "FALLING"
        return "STABLE"

    def get_status_ch4(val: float) -> str:
        if val >= 1000: return "CRITICAL"
        if val >= 500: return "ANOMALOUS"
        return "NORMAL"

    def get_status_co(val: float) -> str:
        if val >= 150: return "CRITICAL"
        if val >= 50: return "ANOMALOUS"
        return "NORMAL"

    def get_status_temp(val: float) -> str:
        if val >= 45: return "CRITICAL"
        if val >= 35: return "ANOMALOUS"
        return "NORMAL"

    def get_status_vib(val: float) -> str:
        if val >= 1.0: return "CRITICAL"
        if val >= 0.5: return "ANOMALOUS"
        return "NORMAL"

    spark_ch4 = [r.methane_ppm for r in reversed(recent_readings[:10])]
    spark_co = [r.co_ppm for r in reversed(recent_readings[:10])]
    spark_temp = [r.temperature_c for r in reversed(recent_readings[:10])]
    spark_hum = [r.humidity_pct for r in reversed(recent_readings[:10])]
    spark_vib = [r.vibration_g for r in reversed(recent_readings[:10])]
    spark_water = [1.0 if r.water_detected else 0.0 for r in reversed(recent_readings[:10])]
    spark_batt = [r.battery_pct for r in reversed(recent_readings[:10])]

    return {
        "rover_code": rover.code,
        "zone_code": zone.code if zone else "ZONE-01",
        "zone_name": zone.name if zone else "Mine Sector",
        "battery_pct": latest.battery_pct,
        "is_connected": True,
        "overall_status": rover.hazard_status,
        "risk_score": latest.risk_score,
        "last_ping": latest.timestamp,

        "methane": {
            "current": latest.methane_ppm,
            "unit": "ppm",
            "status": get_status_ch4(latest.methane_ppm),
            "trend": calc_trend(latest.methane_ppm, prev.methane_ppm, 3.0),
            "previous": prev.methane_ppm,
            "rate_of_change": round(latest.methane_ppm - prev.methane_ppm, 1),
            "sparkline": spark_ch4,
            "min_safe": 0,
            "max_safe": 500
        },
        "co": {
            "current": latest.co_ppm,
            "unit": "ppm",
            "status": get_status_co(latest.co_ppm),
            "trend": calc_trend(latest.co_ppm, prev.co_ppm, 1.0),
            "previous": prev.co_ppm,
            "rate_of_change": round(latest.co_ppm - prev.co_ppm, 1),
            "sparkline": spark_co,
            "min_safe": 0,
            "max_safe": 500
        },
        "temperature": {
            "current": latest.temperature_c,
            "unit": "°C",
            "status": get_status_temp(latest.temperature_c),
            "trend": calc_trend(latest.temperature_c, prev.temperature_c, 0.2),
            "previous": prev.temperature_c,
            "rate_of_change": round(latest.temperature_c - prev.temperature_c, 1),
            "sparkline": spark_temp,
            "min_safe": 15,
            "max_safe": 35
        },
        "humidity": {
            "current": latest.humidity_pct,
            "unit": "%",
            "status": "NORMAL" if latest.humidity_pct < 85 else "ANOMALOUS",
            "trend": calc_trend(latest.humidity_pct, prev.humidity_pct, 1.0),
            "previous": prev.humidity_pct,
            "rate_of_change": round(latest.humidity_pct - prev.humidity_pct, 1),
            "sparkline": spark_hum,
            "min_safe": 30,
            "max_safe": 80
        },
        "vibration": {
            "current": latest.vibration_g,
            "unit": "g",
            "status": get_status_vib(latest.vibration_g),
            "trend": calc_trend(latest.vibration_g, prev.vibration_g, 0.05),
            "previous": prev.vibration_g,
            "rate_of_change": round(latest.vibration_g - prev.vibration_g, 2),
            "sparkline": spark_vib,
            "min_safe": 0,
            "max_safe": 0.5
        },
        "water": {
            "current": 1.0 if latest.water_detected else 0.0,
            "unit": "state",
            "status": "CRITICAL" if latest.water_detected else "NORMAL",
            "trend": "RISING" if latest.water_detected and not prev.water_detected else "STABLE",
            "previous": 1.0 if prev.water_detected else 0.0,
            "rate_of_change": 0.0,
            "sparkline": spark_water,
            "min_safe": 0,
            "max_safe": 0
        },
        "battery": {
            "current": latest.battery_pct,
            "unit": "%",
            "status": "CRITICAL" if latest.battery_pct <= 15 else "NORMAL",
            "trend": "FALLING",
            "previous": prev.battery_pct,
            "rate_of_change": round(latest.battery_pct - prev.battery_pct, 2),
            "sparkline": spark_batt,
            "min_safe": 20,
            "max_safe": 100
        }
    }

@router.get("/history", response_model=List[SensorReadingResponse])
def get_sensor_history(
    rover_code: str = "ROVER-01",
    timeframe: str = Query("5m", pattern="^(1m|5m|30m|1h|24h)$"),
    limit: int = 150,
    db: Session = Depends(get_db)
):
    delta_map = {
        "1m": timedelta(minutes=1),
        "5m": timedelta(minutes=5),
        "30m": timedelta(minutes=30),
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24)
    }
    cutoff = datetime.utcnow() - delta_map.get(timeframe, timedelta(minutes=5))
    
    rover = db.query(Rover).filter(Rover.code == rover_code).first()
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")

    readings = db.query(SensorReading).filter(
        SensorReading.rover_id == rover.id,
        SensorReading.timestamp >= cutoff
    ).order_by(SensorReading.timestamp).limit(limit).all()

    return readings
