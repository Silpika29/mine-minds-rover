from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    rover_id = Column(Integer, ForeignKey("rovers.id"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False, index=True)
    patrol_id = Column(Integer, ForeignKey("patrols.id"), nullable=True, index=True)
    
    hazard_type = Column(String(100), nullable=False) # 'METHANE_SPIKE', 'CO_TOXIC', 'MULTI_GAS', 'ROOF_VIBRATION', 'WATER_FLOOD', 'COMM_TIMEOUT'
    severity = Column(String(50), nullable=False, index=True) # 'WARNING', 'CRITICAL'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    risk_score = Column(Float, default=0.0) # 0 - 100
    
    contributing_factors = Column(JSON, nullable=True) # List of factor strings e.g. ["Methane 1150 ppm", "Vibration 1.2g"]
    
    status = Column(String(50), default="ACTIVE", index=True) # 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    rover = relationship("Rover", back_populates="alerts")
    mine = relationship("Mine", back_populates="alerts")
    zone = relationship("Zone", back_populates="alerts")
    patrol = relationship("Patrol", back_populates="alerts")

    __table_args__ = (
        Index("idx_alert_status_created", "status", "created_at"),
    )
