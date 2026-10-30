from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.mine import Zone
from app.schemas.simulator import SimulatorStatusResponse, ScenarioTriggerRequest, SimulatorControlRequest
from app.simulator.rover_simulator import simulator
from app.services.audit_service import audit_service

router = APIRouter(prefix="/simulator", tags=["Hardware Simulator & Scenarios"])

@router.get("/status", response_model=SimulatorStatusResponse)
def get_simulator_status(db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.code == simulator.current_zone_code).first()
    return {
        "is_running": simulator.is_running,
        "current_mode": simulator.mode,
        "current_zone_code": simulator.current_zone_code,
        "current_zone_name": zone.name if zone else "Mine Sector",
        "patrol_active": (simulator.active_patrol_id is not None),
        "current_patrol_number": f"PATROL-{simulator.active_patrol_id:03d}" if simulator.active_patrol_id else None,
        "step_count": simulator.step_count,
        "battery_level": simulator.battery_level,
        "simulated_lora_snr": 8.5 if simulator.mode != "COMM_LOST" else -12.0,
        "simulated_lora_rssi": -78 if simulator.mode != "COMM_LOST" else -118,
        "last_broadcast_time": simulator.last_broadcast_time
    }

@router.post("/scenario", response_model=SimulatorStatusResponse)
def trigger_scenario(
    req: ScenarioTriggerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_scenarios = [
        "NORMAL", "METHANE_RISING", "MULTI_SENSOR_ANOMALY", 
        "CRITICAL_EMERGENCY", "COMM_LOST", "LOW_BATTERY"
    ]
    if req.scenario not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Valid choices: {valid_scenarios}")

    simulator.set_scenario(req.scenario)

    audit_service.log(
        db=db,
        action="SIMULATOR_SCENARIO_TRIGGERED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="SIMULATOR",
        details={"scenario": req.scenario, "rover_code": req.rover_code}
    )

    return get_simulator_status(db)

@router.post("/control", response_model=SimulatorStatusResponse)
async def control_simulator(
    req: SimulatorControlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.action == "START":
        await simulator.start()
    elif req.action == "STOP":
        await simulator.stop()
    elif req.action == "RESET":
        simulator.reset_to_normal()
    elif req.action == "STEP":
        await simulator._step()
    else:
        raise HTTPException(status_code=400, detail="Invalid simulator action")

    if req.speed_multiplier:
        simulator.speed_multiplier = req.speed_multiplier

    audit_service.log(
        db=db,
        action=f"SIMULATOR_{req.action}",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="SIMULATOR",
        details={"action": req.action, "speed": simulator.speed_multiplier}
    )

    return get_simulator_status(db)
