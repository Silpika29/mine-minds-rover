from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(Integer, primary_key=True, index=True)
    rover_id = Column(Integer, ForeignKey("rovers.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    
    prediction = Column(String(50), nullable=False) # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    confidence = Column(Float, nullable=False) # e.g. 0.91 (91%)
    risk_score = Column(Float, nullable=False) # 0 - 100
    
    features = Column(JSON, nullable=True) # Dict of calculated window features
    explanations = Column(JSON, nullable=True) # List of contribution explanations
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    rover = relationship("Rover", back_populates="ml_predictions")
