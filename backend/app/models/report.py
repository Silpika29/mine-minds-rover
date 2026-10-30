from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patrol_id = Column(Integer, ForeignKey("patrols.id"), nullable=False, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'RPT-PATROL-024'
    title = Column(String(200), nullable=False)
    file_path = Column(String(255), nullable=True)
    format = Column(String(20), default="PDF") # 'PDF', 'CSV'
    
    generated_by = Column(String(100), default="SYSTEM")
    summary_json = Column(JSON, nullable=True) # Full structured payload used for rendering
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    patrol = relationship("Patrol", back_populates="reports")
