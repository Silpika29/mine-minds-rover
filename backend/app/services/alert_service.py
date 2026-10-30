from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.alert import Alert
from app.models.rover import Rover
from app.models.mine import Mine, Zone

class AlertService:
    COOLDOWN_SECONDS = 60 # Cooldown window to avoid repetitive spam

    @staticmethod
    def create_or_update_alert(
        db: Session,
        rover_id: int,
        mine_id: int,
        zone_id: int,
        hazard_type: str,
        severity: str,
        title: str,
        description: str,
        risk_score: float,
        contributing_factors: List[str],
        patrol_id: Optional[int] = None
    ) -> Optional[Alert]:
        """
        Creates a new alert or skips if an active alert of the same type and zone was recently fired.
        If a WARNING exists and a CRITICAL is detected, it upgrades immediately.
        """
        recent_cutoff = datetime.utcnow() - timedelta(seconds=AlertService.COOLDOWN_SECONDS)
        
        existing = db.query(Alert).filter(
            Alert.rover_id == rover_id,
            Alert.zone_id == zone_id,
            Alert.hazard_type == hazard_type,
            Alert.status == "ACTIVE",
            Alert.created_at >= recent_cutoff
        ).first()

        if existing:
            # Upgrade severity if escalated
            if existing.severity == "WARNING" and severity == "CRITICAL":
                existing.severity = "CRITICAL"
                existing.title = title
                existing.description = description
                existing.risk_score = risk_score
                existing.contributing_factors = contributing_factors
                db.commit()
                db.refresh(existing)
                return existing
            return None # Skip duplicate

        new_alert = Alert(
            rover_id=rover_id,
            mine_id=mine_id,
            zone_id=zone_id,
            patrol_id=patrol_id,
            hazard_type=hazard_type,
            severity=severity,
            title=title,
            description=description,
            risk_score=risk_score,
            contributing_factors=contributing_factors,
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        return new_alert

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int, username: str, notes: Optional[str] = None) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by = username
        alert.acknowledged_at = datetime.utcnow()
        if notes:
            alert.resolution_notes = notes
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: int, username: str, resolution_notes: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        
        alert.status = "RESOLVED"
        alert.resolved_by = username
        alert.resolved_at = datetime.utcnow()
        alert.resolution_notes = resolution_notes
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_active_alerts(db: Session, mine_id: Optional[int] = None) -> List[Alert]:
        query = db.query(Alert).filter(Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"]))
        if mine_id:
            query = query.filter(Alert.mine_id == mine_id)
        return query.order_by(desc(Alert.created_at)).all()

alert_service = AlertService()
