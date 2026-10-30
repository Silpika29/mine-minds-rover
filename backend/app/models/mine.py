from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'MINE-ALPHA'
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE") # 'ACTIVE', 'MAINTENANCE', 'EVACUATED'
    created_at = Column(DateTime, default=datetime.utcnow)

    zones = relationship("Zone", back_populates="mine", cascade="all, delete-orphan", order_by="Zone.order_index")
    rovers = relationship("Rover", back_populates="mine")
    supervisors = relationship("User", back_populates="assigned_mine")
    patrols = relationship("Patrol", back_populates="mine")
    alerts = relationship("Alert", back_populates="mine")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True) # e.g. 'ENTRY', 'ZONE-01', 'ZONE-02', 'ZONE-03', 'ZONE-04'
    name = Column(String(150), nullable=False)
    order_index = Column(Integer, default=0)
    x_coord = Column(Float, default=0.0)
    y_coord = Column(Float, default=0.0)
    length_meters = Column(Float, default=100.0)
    
    # Custom thresholds per zone (optional overrides)
    ch4_threshold_warning = Column(Float, default=500.0)
    ch4_threshold_critical = Column(Float, default=1000.0)
    co_threshold_warning = Column(Float, default=50.0)
    co_threshold_critical = Column(Float, default=150.0)
    temp_threshold_warning = Column(Float, default=35.0)
    temp_threshold_critical = Column(Float, default=45.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    mine = relationship("Mine", back_populates="zones")
    sensor_readings = relationship("SensorReading", back_populates="zone")
    alerts = relationship("Alert", back_populates="zone")
    patrol_events = relationship("PatrolEvent", back_populates="zone")
