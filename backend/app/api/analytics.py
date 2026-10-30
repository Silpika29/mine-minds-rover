from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & AI Insights"])

@router.get("/zones", response_model=List[Dict[str, Any]])
def get_zone_safety_analytics(mine_id: Optional[int] = None, db: Session = Depends(get_db)):
    return analytics_service.get_zone_safety_overview(db, mine_id=mine_id)

@router.get("/trends", response_model=List[Dict[str, Any]])
def get_sensor_trends(
    mine_id: Optional[int] = None,
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    return analytics_service.get_gas_progression_trend(db, mine_id=mine_id, hours=hours)

@router.get("/insights", response_model=List[Dict[str, Any]])
def get_automated_ai_insights(mine_id: Optional[int] = None, db: Session = Depends(get_db)):
    return analytics_service.generate_automated_insights(db, mine_id=mine_id)
