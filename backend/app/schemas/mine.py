from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ZoneBase(BaseModel):
    code: str
    name: str
    order_index: int = 0
    x_coord: float = 0.0
    y_coord: float = 0.0
    length_meters: float = 100.0
    ch4_threshold_warning: float = 500.0
    ch4_threshold_critical: float = 1000.0
    co_threshold_warning: float = 50.0
    co_threshold_critical: float = 150.0
    temp_threshold_warning: float = 35.0
    temp_threshold_critical: float = 45.0

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: int
    mine_id: int
    created_at: datetime
    latest_status: Optional[str] = "NORMAL"
    latest_risk_score: Optional[float] = 0.0
    last_inspected_at: Optional[datetime] = None
    hazard_count: Optional[int] = 0

    class Config:
        from_attributes = True

class MineBase(BaseModel):
    code: str
    name: str
    location: str
    description: Optional[str] = None
    status: str = "ACTIVE"

class MineCreate(MineBase):
    pass

class MineResponse(MineBase):
    id: int
    created_at: datetime
    zones: List[ZoneResponse] = []
    active_rovers_count: Optional[int] = 0
    active_alerts_count: Optional[int] = 0
    overall_safety_status: Optional[str] = "NORMAL"

    class Config:
        from_attributes = True
