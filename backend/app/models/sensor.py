from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    rover_id = Column(Integer, ForeignKey("rovers.id"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False, index=True)
    
    # Telemetry metrics
    methane_ppm = Column(Float, nullable=False) # CH4 in ppm
    co_ppm = Column(Float, nullable=False) # CO in ppm
    temperature_c = Column(Float, nullable=False) # Celsius
    humidity_pct = Column(Float, nullable=False) # Percentage %
    water_detected = Column(Boolean, default=False)
    vibration_g = Column(Float, nullable=False) # g-force
    battery_pct = Column(Float, nullable=False) # 0 - 100%
    
    # Processed assessment
    rule_status = Column(String(50), default="NORMAL") # 'NORMAL', 'WARNING', 'CRITICAL'
    ml_status = Column(String(50), default="NORMAL") # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    risk_score = Column(Float, default=0.0) # 0 - 100
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    rover = relationship("Rover", back_populates="sensor_readings")
    zone = relationship("Zone", back_populates="sensor_readings")

    __table_args__ = (
        Index("idx_sensor_rover_time", "rover_id", "timestamp"),
        Index("idx_sensor_zone_time", "zone_id", "timestamp"),
    )
