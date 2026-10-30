from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

class Patrol(Base):
    __tablename__ = "patrols"

    id = Column(Integer, primary_key=True, index=True)
    patrol_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'PATROL-024'
    rover_id = Column(Integer, ForeignKey("rovers.id"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False, index=True)
    
    start_time = Column(DateTime, default=datetime.utcnow, index=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    distance_meters = Column(Float, default=0.0)
    
    zones_inspected = Column(JSON, default=list) # List of zone codes e.g. ['ENTRY', 'ZONE-01', 'ZONE-02']
    normal_events_count = Column(Integer, default=0)
    anomalies_count = Column(Integer, default=0)
    critical_events_count = Column(Integer, default=0)
    
    final_status = Column(String(50), default="IN_PROGRESS") # 'IN_PROGRESS', 'NORMAL', 'ANOMALOUS', 'ALERT', 'ABORTED'
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    rover = relationship("Rover", back_populates="patrols")
    mine = relationship("Mine", back_populates="patrols")
    events = relationship("PatrolEvent", back_populates="patrol", cascade="all, delete-orphan", order_by="PatrolEvent.timestamp")
    alerts = relationship("Alert", back_populates="patrol")
    reports = relationship("Report", back_populates="patrol")

class PatrolEvent(Base):
    __tablename__ = "patrol_events"

    id = Column(Integer, primary_key=True, index=True)
    patrol_id = Column(Integer, ForeignKey("patrols.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50), nullable=False) # 'START', 'CHECKPOINT', 'ANOMALY', 'CRITICAL', 'ALERT_TRIGGERED', 'RETURN', 'COMPLETE'
    description = Column(String(255), nullable=False)
    risk_score = Column(Float, default=0.0)
    sensor_snapshot = Column(JSON, nullable=True) # Dict of readings at that moment

    patrol = relationship("Patrol", back_populates="events")
    zone = relationship("Zone", back_populates="patrol_events")
