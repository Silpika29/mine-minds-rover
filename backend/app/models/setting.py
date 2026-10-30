from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from app.database.session import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=True)
    value = Column(JSON, nullable=False)
    unit = Column(String(50), nullable=True)
    description = Column(String(255), nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

