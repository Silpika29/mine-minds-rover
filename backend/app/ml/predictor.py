import os
import json
from typing import List, Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd

from app.ml.feature_extractor import extract_features_from_window, FEATURE_NAMES
from app.ml.train_model import MODEL_PATH, METRICS_PATH, CLASS_MAPPING, train_and_evaluate_model

class MLPredictor:
    def __init__(self):
        self.model = None
        self.metrics = None
        self._load_or_train()

    def _load_or_train(self):
        if not os.path.exists(MODEL_PATH) or not os.path.exists(METRICS_PATH):
            print("ML model artifacts not found. Training model now...")
            self.model, self.metrics = train_and_evaluate_model()
        else:
            try:
                self.model = joblib.load(MODEL_PATH)
                with open(METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
            except Exception as e:
                print(f"Error loading model artifacts ({e}). Retraining...")
                self.model, self.metrics = train_and_evaluate_model()

    def get_metrics(self) -> Dict[str, Any]:
        if not self.metrics:
            self._load_or_train()
        return self.metrics

    def predict(
        self,
        ch4_window: List[float],
        co_window: List[float],
        temp_window: List[float],
        hum_window: List[float],
        vib_window: List[float],
        water_window: List[Any],
        batt_window: List[float],
        comm_health: float = 1.0,
        time_delta_seconds: float = 2.0
    ) -> Dict[str, Any]:
        """
        Executes real-time inference with feature engineering, 
        confidence calculation, risk score aggregation, and local explainability.
        """
        if not self.model:
            self._load_or_train()

        features = extract_features_from_window(
            ch4_window=ch4_window,
            co_window=co_window,
            temp_window=temp_window,
            hum_window=hum_window,
            vib_window=vib_window,
            water_window=water_window,
            batt_window=batt_window,
            comm_health=comm_health,
            time_delta_seconds=time_delta_seconds
        )

        feat_vector = np.array([[features[name] for name in FEATURE_NAMES]])
        probs = self.model.predict_proba(feat_vector)[0] # [P(NORMAL), P(ANOMALOUS), P(CRITICAL)]
        
        pred_class_idx = int(np.argmax(probs))
        prediction_label = CLASS_MAPPING.get(pred_class_idx, "NORMAL")
        confidence = float(probs[pred_class_idx])

        # Generate Explainability (Feature contributions)
        explanations = self._generate_explanations(features, prediction_label, probs)

        # Calculate 0-100 Composite Risk Score
        risk_score = self._calculate_risk_score(features, prediction_label, probs)

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 3),
            "probabilities": {
                "NORMAL": round(float(probs[0]), 3),
                "ANOMALOUS": round(float(probs[1]), 3),
                "CRITICAL": round(float(probs[2]), 3) if len(probs) > 2 else 0.0,
            },
            "risk_score": round(risk_score, 1),
            "explanations": explanations,
            "features": features
        }

    def _generate_explanations(self, features: Dict[str, float], prediction: str, probs: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generates human-readable Explainable AI factors describing why 
        the AI classified the state as Normal, Anomalous, or Critical.
        """
        factors = []

        # 1. Methane Trend Analysis
        gas_curr = features["gas_current"]
        gas_rate = features["gas_rate"]
        if gas_curr >= 1000.0 or gas_rate >= 20.0:
            factors.append({
                "feature_name": "gas_rate",
                "display_name": "Methane (CH4) Trend",
                "value": f"{gas_curr:.1f} ppm ({gas_rate:+.1f} ppm/s)",
                "impact": "HIGH",
                "direction": "POSITIVE",
                "description": f"Rapid gas buildup detected: {gas_curr:.0f} ppm with steep climb gradient ({gas_rate:+.1f} ppm/s)."
            })
        elif gas_curr >= 500.0 or gas_rate >= 5.0:
            factors.append({
                "feature_name": "gas_rate",
                "display_name": "Methane (CH4) Gradient",
                "value": f"{gas_curr:.1f} ppm ({gas_rate:+.1f} ppm/s)",
                "impact": "MODERATE",
                "direction": "POSITIVE",
                "description": f"Elevated methane trend detected ({gas_curr:.0f} ppm)."
            })

        # 2. Carbon Monoxide Analysis
        co_curr = features["co_current"]
        co_rate = features["co_rate"]
        if co_curr >= 150.0 or co_rate >= 5.0:
            factors.append({
                "feature_name": "co_current",
                "display_name": "Carbon Monoxide (CO)",
                "value": f"{co_curr:.1f} ppm ({co_rate:+.1f} ppm/s)",
                "impact": "HIGH",
                "direction": "POSITIVE",
                "description": f"Hazardous toxic carbon monoxide concentration ({co_curr:.1f} ppm)."
            })
        elif co_curr >= 50.0:
            factors.append({
                "feature_name": "co_current",
                "display_name": "Carbon Monoxide (CO)",
                "value": f"{co_curr:.1f} ppm",
                "impact": "MODERATE",
                "direction": "POSITIVE",
                "description": f"Elevated CO concentration ({co_curr:.1f} ppm)."
            })

        # 3. Vibration / Seismic Analysis
        vib_curr = features["vibration_current"]
        vib_std = features["vibration_std"]
        if vib_curr >= 1.0 or vib_std >= 0.3:
            factors.append({
                "feature_name": "vibration_current",
                "display_name": "Structural Vibration",
                "value": f"{vib_curr:.2f}g (std: {vib_std:.2f})",
                "impact": "HIGH",
                "direction": "POSITIVE",
                "description": f"Abnormal seismic vibration detected ({vib_curr:.2f}g) indicating potential structural or roof instability."
            })
        elif vib_curr >= 0.5:
            factors.append({
                "feature_name": "vibration_current",
                "display_name": "Structural Vibration",
                "value": f"{vib_curr:.2f}g",
                "impact": "MODERATE",
                "direction": "POSITIVE",
                "description": f"Elevated mechanical/acoustic vibration ({vib_curr:.2f}g)."
            })

        # 4. Temperature Analysis
        temp_curr = features["temperature_current"]
        temp_rate = features["temperature_rate"]
        if temp_curr >= 45.0 or temp_rate >= 0.5:
            factors.append({
                "feature_name": "temperature_current",
                "display_name": "Thermal Gradient",
                "value": f"{temp_curr:.1f}°C ({temp_rate:+.2f}°C/s)",
                "impact": "HIGH",
                "direction": "POSITIVE",
                "description": f"Critical heat buildup detected ({temp_curr:.1f}°C)."
            })
        elif temp_curr >= 35.0:
            factors.append({
                "feature_name": "temperature_current",
                "display_name": "Ambient Temperature",
                "value": f"{temp_curr:.1f}°C",
                "impact": "MODERATE",
                "direction": "POSITIVE",
                "description": f"Elevated ambient temperature ({temp_curr:.1f}°C)."
            })

        # 5. Water Status
        if features["water_status"] > 0.5:
            factors.append({
                "feature_name": "water_status",
                "display_name": "Sub-floor Water Ingress",
                "value": "Water Detected",
                "impact": "HIGH",
                "direction": "POSITIVE",
                "description": "Standing water or flooding condition sensed at rover chassis level."
            })

        # 6. Communication Health
        if features["communication_health"] < 0.8:
            factors.append({
                "feature_name": "communication_health",
                "display_name": "LoRa Signal Integrity",
                "value": f"{features['communication_health']*100:.0f}%",
                "impact": "MODERATE",
                "direction": "NEGATIVE",
                "description": "Signal degradation or packet drop observed on communication link."
            })

        # If Normal and no factors triggered, provide baseline stability factor
        if not factors:
            factors.append({
                "feature_name": "ambient_baseline",
                "display_name": "Atmospheric Baseline",
                "value": f"CH4: {gas_curr:.0f} ppm, CO: {co_curr:.0f} ppm, {temp_curr:.1f}°C",
                "impact": "LOW",
                "direction": "NEUTRAL",
                "description": "All sensor telemetry metrics remain within nominal baseline safety limits."
            })

        return factors

    def _calculate_risk_score(self, features: Dict[str, float], prediction: str, probs: np.ndarray) -> float:
        """
        Computes a deterministic 0-100 composite risk score:
        - 0-30: LOW
        - 31-60: MODERATE
        - 61-80: HIGH
        - 81-100: CRITICAL
        """
        base_score = 0.0

        # Gas contribution (up to 40 pts)
        gas_val = features["gas_current"]
        if gas_val > 1000:
            base_score += 40.0
        elif gas_val > 500:
            base_score += 15.0 + (gas_val - 500) / 500.0 * 20.0
        else:
            base_score += (gas_val / 500.0) * 8.0

        # CO contribution (up to 25 pts)
        co_val = features["co_current"]
        if co_val > 150:
            base_score += 25.0
        elif co_val > 50:
            base_score += 10.0 + (co_val - 50) / 100.0 * 12.0
        else:
            base_score += (co_val / 50.0) * 5.0

        # Vibration contribution (up to 20 pts)
        vib_val = features["vibration_current"]
        if vib_val > 1.0:
            base_score += 20.0
        elif vib_val > 0.5:
            base_score += 8.0 + (vib_val - 0.5) / 0.5 * 10.0

        # Temperature contribution (up to 15 pts)
        temp_val = features["temperature_current"]
        if temp_val > 45:
            base_score += 15.0
        elif temp_val > 35:
            base_score += 5.0 + (temp_val - 35) / 10.0 * 8.0

        # Water accumulation (15 pts)
        if features["water_status"] > 0.5:
            base_score += 15.0

        # Rate multipliers
        if features["gas_rate"] > 10.0:
            base_score += 10.0
        if features["co_rate"] > 3.0:
            base_score += 8.0

        # Blend with ML Critical Probability
        crit_prob = float(probs[2]) if len(probs) > 2 else 0.0
        anom_prob = float(probs[1]) if len(probs) > 1 else 0.0
        
        ml_boost = (crit_prob * 35.0) + (anom_prob * 15.0)
        final_score = min(100.0, max(0.0, (base_score * 0.7) + (ml_boost * 0.3)))
        
        # If prediction is explicitly critical, ensure score >= 81
        if prediction == "CRITICAL" and final_score < 81.0:
            final_score = 81.0 + (final_score % 15.0)
        elif prediction == "ANOMALOUS" and final_score < 40.0:
            final_score = 40.0 + (final_score % 20.0)

        return float(np.clip(final_score, 0.0, 100.0))

predictor = MLPredictor()
