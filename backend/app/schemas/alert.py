from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

class AlertResponse(BaseModel):
    id: int
    rover_id: int
    rover_code: Optional[str] = None
    mine_id: int
    mine_name: Optional[str] = None
    zone_id: int
    zone_code: Optional[str] = None
    zone_name: Optional[str] = None
    patrol_id: Optional[int] = None
    hazard_type: str
    severity: str # 'WARNING', 'CRITICAL'
    title: str
    description: str
    risk_score: float
    contributing_factors: Optional[List[str]] = None
    status: str # 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None

class AlertResolveRequest(BaseModel):
    resolution_notes: str
