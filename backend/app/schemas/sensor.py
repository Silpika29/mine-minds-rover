from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SensorPayload(BaseModel):
    rover_id: str = Field(..., example="ROVER-01")
    zone_code: str = Field(..., example="ZONE-03")
    methane: float = Field(..., example=480.5, description="CH4 in ppm")
    co: float = Field(..., example=75.2, description="CO in ppm")
    temperature: float = Field(..., example=28.4, description="Temperature in Celsius")
    humidity: float = Field(..., example=62.0, description="Humidity percentage")
    water: bool = Field(default=False, description="Water presence detected")
    vibration: float = Field(..., example=0.25, description="Vibration in g-force")
    battery: float = Field(..., example=85.0, description="Battery percentage 0-100")
    timestamp: Optional[datetime] = None

class SensorReadingResponse(BaseModel):
    id: int
    rover_id: int
    mine_id: int
    zone_id: int
    methane_ppm: float
    co_ppm: float
    temperature_c: float
    humidity_pct: float
    water_detected: bool
    vibration_g: float
    battery_pct: float
    rule_status: str
    ml_status: str
    risk_score: float
    timestamp: datetime

    class Config:
        from_attributes = True

class SensorLatestData(BaseModel):
    current: float
    unit: str
    status: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    trend: str # 'RISING', 'FALLING', 'STABLE'
    previous: float
    rate_of_change: float
    sparkline: List[float]
    min_safe: float
    max_safe: float

class SensorsOverviewResponse(BaseModel):
    rover_code: str
    zone_code: str
    zone_name: str
    battery_pct: Optional[float] = None
    is_connected: bool = False
    overall_status: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL', 'OFFLINE'
    risk_score: float
    last_ping: Optional[datetime] = None
    methane: Optional[SensorLatestData] = None
    co: Optional[SensorLatestData] = None
    temperature: Optional[SensorLatestData] = None
    humidity: Optional[SensorLatestData] = None
    vibration: Optional[SensorLatestData] = None
    water: Optional[SensorLatestData] = None
    battery: Optional[SensorLatestData] = None

