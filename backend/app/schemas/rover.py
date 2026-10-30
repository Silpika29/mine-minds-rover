from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class RoverBase(BaseModel):
    code: str
    name: str
    mine_id: int
    camera_url: Optional[str] = None
    firmware_version: Optional[str] = "v2.4.1-esp32-lora"
    is_active: bool = True

class RoverCreate(RoverBase):
    pass

class RoverUpdate(BaseModel):
    name: Optional[str] = None
    mine_id: Optional[int] = None
    camera_url: Optional[str] = None
    firmware_version: Optional[str] = None
    is_active: Optional[bool] = None

class RoverResponse(RoverBase):
    id: int
    current_zone_id: Optional[int] = None
    current_zone_code: Optional[str] = None
    current_zone_name: Optional[str] = None
    mine_name: Optional[str] = None
    battery_level: float
    status: str # 'IDLE', 'PATROLLING', 'RETURNING', 'OFFLINE', 'EMERGENCY'
    hazard_status: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    last_ping_at: datetime
    created_at: datetime
    is_online: bool = True

    class Config:
        from_attributes = True
