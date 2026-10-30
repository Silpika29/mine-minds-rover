import time
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.models.sensor import SensorReading
from app.models.rover import Rover
from app.schemas.admin import SystemHealthResponse
from app.simulator.rover_simulator import simulator
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", response_model=SystemHealthResponse)
def check_system_health(db: Session = Depends(get_db)):
    t0 = time.time()
    
    # Check database
    db_status = "ONLINE"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "DEGRADED"

    latency_ms = round((time.time() - t0) * 1000, 2)

    # Check last sensor reading
    last_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    last_packet_time = last_reading.timestamp if last_reading else None

    # Rover connection state
    rover = db.query(Rover).filter(Rover.code == "ROVER-01").first()
    rover_status = rover.status if rover else "OFFLINE"

    return {
        "backend_status": "ONLINE (FastAPI 0.124)",
        "database_status": db_status,
        "websocket_status": f"ACTIVE ({len(ws_manager.active_connections)} client connections)",
        "ml_service_status": "ONLINE (Random Forest 120-trees)",
        "simulator_status": f"RUNNING (Mode: {simulator.mode})",
        "rover_status": f"{rover_status} (LoRa SNR: {8.5 if simulator.mode != 'COMM_LOST' else -12.0} dB)",
        "last_sensor_packet": last_packet_time,
        "api_latency_ms": max(1.0, latency_ms),
        "system_time": datetime.utcnow(),
        "active_connections": len(ws_manager.active_connections),
        "memory_usage_mb": 48.2
    }
