from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class PatrolEventResponse(BaseModel):
    id: int
    patrol_id: int
    zone_id: Optional[int] = None
    zone_code: Optional[str] = None
    zone_name: Optional[str] = None
    timestamp: datetime
    event_type: str
    description: str
    risk_score: float
    sensor_snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class PatrolResponse(BaseModel):
    id: int
    patrol_number: str
    rover_id: int
    rover_code: Optional[str] = None
    mine_id: int
    mine_name: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    distance_meters: float
    zones_inspected: List[str]
    normal_events_count: int
    anomalies_count: int
    critical_events_count: int
    final_status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PatrolDetailResponse(PatrolResponse):
    events: List[PatrolEventResponse] = []

class PatrolControlRequest(BaseModel):
    action: str # 'START', 'STOP', 'ABORT', 'RETURN'
    rover_id: Optional[str] = "ROVER-01"
