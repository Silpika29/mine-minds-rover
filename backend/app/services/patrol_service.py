from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.patrol import Patrol, PatrolEvent
from app.models.rover import Rover
from app.models.mine import Zone

class PatrolService:
    @staticmethod
    def start_patrol(db: Session, rover_id: int, mine_id: int) -> Patrol:
        # Check if already in progress
        active_patrol = db.query(Patrol).filter(
            Patrol.rover_id == rover_id,
            Patrol.final_status == "IN_PROGRESS"
        ).first()
        if active_patrol:
            return active_patrol

        # Generate sequential patrol number
        count = db.query(Patrol).count() + 1
        patrol_number = f"PATROL-{count:03d}"

        new_patrol = Patrol(
            patrol_number=patrol_number,
            rover_id=rover_id,
            mine_id=mine_id,
            start_time=datetime.utcnow(),
            final_status="IN_PROGRESS",
            zones_inspected=[],
            normal_events_count=0,
            anomalies_count=0,
            critical_events_count=0,
            distance_meters=0.0
        )
        db.add(new_patrol)
        db.commit()
        db.refresh(new_patrol)

        # Log start event
        start_event = PatrolEvent(
            patrol_id=new_patrol.id,
            timestamp=datetime.utcnow(),
            event_type="START",
            description=f"Patrol {patrol_number} initiated. Telemetry link active.",
            risk_score=0.0
        )
        db.add(start_event)
        
        # Update rover status
        rover = db.query(Rover).filter(Rover.id == rover_id).first()
        if rover:
            rover.status = "PATROLLING"
            
        db.commit()
        return new_patrol

    @staticmethod
    def log_event(
        db: Session,
        patrol_id: int,
        event_type: str,
        description: str,
        zone_id: Optional[int] = None,
        risk_score: float = 0.0,
        sensor_snapshot: Optional[Dict[str, Any]] = None
    ) -> PatrolEvent:
        patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
        if not patrol:
            return None

        event = PatrolEvent(
            patrol_id=patrol_id,
            zone_id=zone_id,
            timestamp=datetime.utcnow(),
            event_type=event_type,
            description=description,
            risk_score=risk_score,
            sensor_snapshot=sensor_snapshot
        )
        db.add(event)

        # Update patrol stats
        if event_type == "CHECKPOINT" and zone_id:
            zone = db.query(Zone).filter(Zone.id == zone_id).first()
            if zone:
                current_zones = list(patrol.zones_inspected or [])
                if zone.code not in current_zones:
                    current_zones.append(zone.code)
                    patrol.zones_inspected = current_zones
                    patrol.distance_meters += (zone.length_meters or 100.0)
                patrol.normal_events_count += 1
        elif event_type == "ANOMALY":
            patrol.anomalies_count += 1
        elif event_type in ["CRITICAL", "ALERT_TRIGGERED"]:
            patrol.critical_events_count += 1

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def finish_patrol(
        db: Session,
        patrol_id: int,
        status: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[Patrol]:
        patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
        if not patrol:
            return None

        patrol.end_time = datetime.utcnow()
        duration = int((patrol.end_time - patrol.start_time).total_seconds())
        patrol.duration_seconds = max(1, duration)

        if not status or status == "IN_PROGRESS":
            if patrol.critical_events_count > 0:
                patrol.final_status = "ALERT"
            elif patrol.anomalies_count > 0:
                patrol.final_status = "ANOMALOUS"
            else:
                patrol.final_status = "NORMAL"
        else:
            patrol.final_status = status

        if notes:
            patrol.notes = notes

        # Log completion event
        complete_event = PatrolEvent(
            patrol_id=patrol.id,
            timestamp=datetime.utcnow(),
            event_type="COMPLETE",
            description=f"Patrol concluded with status {patrol.final_status}. Distance: {patrol.distance_meters:.0f}m, Duration: {duration//60}m {duration%60}s.",
            risk_score=0.0
        )
        db.add(complete_event)

        # Update rover state
        rover = db.query(Rover).filter(Rover.id == patrol.rover_id).first()
        if rover:
            rover.status = "IDLE"

        db.commit()
        db.refresh(patrol)
        return patrol

patrol_service = PatrolService()
