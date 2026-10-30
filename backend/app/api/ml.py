from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.ml.predictor import predictor
from app.ml.train_model import train_and_evaluate_model
from app.schemas.ml import MLMetricsResponse, MLTrainResponse
from app.schemas.sensor import SensorPayload
from app.models.user import User

router = APIRouter(prefix="/ml", tags=["Machine Learning & XAI"])

@router.get("/metrics", response_model=MLMetricsResponse)
def get_ml_metrics():
    """
    Returns calculated performance metrics from the trained Random Forest model.
    """
    metrics = predictor.get_metrics()
    return metrics

@router.post("/train", response_model=MLTrainResponse)
def retrain_model(current_user: User = Depends(require_admin)):
    """
    Retrains the Random Forest model and updates artifacts. Admin only.
    """
    model, metrics = train_and_evaluate_model()
    predictor.model = model
    predictor.metrics = metrics
    return {
        "status": "SUCCESS",
        "message": f"Random Forest model retrained successfully with {metrics['total_samples']} samples. Critical recall: {metrics['critical_recall']}%",
        "metrics": metrics
    }
