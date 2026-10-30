from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(80), nullable=True)
    action = Column(String(100), nullable=False) # 'USER_LOGIN', 'ALERT_ACKNOWLEDGED', 'ROVER_SCENARIO_TRIGGER', etc.
    resource_type = Column(String(100), nullable=True) # 'USER', 'ALERT', 'ROVER', 'PATROL'
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    status = Column(String(50), default="SUCCESS") # 'SUCCESS', 'FAILURE'
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
