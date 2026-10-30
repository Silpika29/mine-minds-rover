from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class ReportResponse(BaseModel):
    id: int
    patrol_id: int
    report_code: str
    title: str
    file_path: Optional[str] = None
    format: str # 'PDF', 'CSV'
    generated_by: str
    summary_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportGenerateRequest(BaseModel):
    patrol_id: int
    format: str = "PDF" # 'PDF' or 'CSV'
