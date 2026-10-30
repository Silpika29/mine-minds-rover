from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SimulatorStatusResponse(BaseModel):
    is_running: bool
    current_mode: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL', 'MULTI_SENSOR', 'COMM_LOST', 'LOW_BATTERY'
    current_zone_code: str
    current_zone_name: str
    patrol_active: bool
    current_patrol_number: Optional[str] = None
    step_count: int
    battery_level: float
    simulated_lora_snr: float
    simulated_lora_rssi: int
    last_broadcast_time: Optional[datetime] = None

class ScenarioTriggerRequest(BaseModel):
    scenario: str # 'NORMAL', 'METHANE_RISING', 'MULTI_SENSOR_ANOMALY', 'CRITICAL_EMERGENCY', 'COMM_LOST', 'LOW_BATTERY'
    rover_code: Optional[str] = "ROVER-01"

class SimulatorControlRequest(BaseModel):
    action: str # 'START', 'STOP', 'RESET', 'STEP'
    speed_multiplier: Optional[float] = 1.0
