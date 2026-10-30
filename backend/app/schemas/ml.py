from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FeatureExplanation(BaseModel):
    feature_name: str
    display_name: str
    value: Any
    impact: str # 'HIGH', 'MODERATE', 'LOW'
    description: str
    direction: str # 'POSITIVE', 'NEGATIVE', 'NEUTRAL'

class MLPredictionResponse(BaseModel):
    rover_id: str
    zone_code: str
    prediction: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    confidence: float # 0.0 - 1.0 (e.g. 0.91)
    risk_score: float # 0 - 100
    rule_status: str # 'NORMAL', 'WARNING', 'CRITICAL'
    final_assessment: str # 'NORMAL', 'ANOMALOUS', 'CRITICAL'
    explanations: List[FeatureExplanation]
    features: Dict[str, Any]
    timestamp: datetime

class MLMetricsResponse(BaseModel):
    model_name: str = "Random Forest Classifier"
    total_samples: int
    training_samples: int
    test_samples: int
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    critical_recall: float
    classes: List[str]
    confusion_matrix: List[List[int]]
    feature_importances: List[Dict[str, Any]]
    last_trained_at: datetime
    is_synthetic_dataset: bool = True
    disclaimer: str = "Trained on synthetic prototype data modeling mine environmental anomalies. Not certified for actual mine deployment."

class MLTrainResponse(BaseModel):
    status: str
    message: str
    metrics: MLMetricsResponse
