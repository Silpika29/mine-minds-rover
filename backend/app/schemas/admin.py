from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DatabaseTableCount(BaseModel):
    table_name: str
    record_count: int

class DatabaseStatsResponse(BaseModel):
    database_type: str
    status: str
    tables: List[DatabaseTableCount]
    total_records: int
    latest_sensor_reading_time: Optional[datetime] = None
    latest_alert_time: Optional[datetime] = None
    latest_patrol_time: Optional[datetime] = None

class TableDataResponse(BaseModel):
    table_name: str
    total_count: int
    page: int
    page_size: int
    columns: List[str]
    rows: List[Dict[str, Any]]

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    backend_status: str
    database_status: str
    websocket_status: str
    ml_service_status: str
    simulator_status: str
    rover_status: str
    last_sensor_packet: Optional[datetime] = None
    api_latency_ms: float
    system_time: datetime
    active_connections: int
    memory_usage_mb: Optional[float] = None
