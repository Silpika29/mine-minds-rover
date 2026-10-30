from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class Rover(Base):
    __tablename__ = "rovers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'ROVER-01'
    name = Column(String(150), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False, index=True)
    current_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    battery_level = Column(Float, default=100.0) # Percentage 0 - 100
    status = Column(String(50), default="IDLE") # 'IDLE', 'PATROLLING', 'RETURNING', 'OFFLINE', 'EMERGENCY'
    hazard_status = Column(String(50), default="NORMAL") # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    firmware_version = Column(String(50), default="v2.4.1-esp32-lora")
    camera_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_ping_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    mine = relationship("Mine", back_populates="rovers")
    current_zone = relationship("Zone", foreign_keys=[current_zone_id])
    sensor_readings = relationship("SensorReading", back_populates="rover")
    patrols = relationship("Patrol", back_populates="rover")
    alerts = relationship("Alert", back_populates="rover")
    ml_predictions = relationship("MLPrediction", back_populates="rover")
