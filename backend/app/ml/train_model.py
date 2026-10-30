import os
import json
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

from app.ml.dataset_generator import generate_synthetic_mine_dataset
from app.ml.feature_extractor import extract_features_df, FEATURE_NAMES

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "random_forest_model.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "model_metrics.json")

CLASS_MAPPING = {
    0: "NORMAL",
    1: "ANOMALOUS",
    2: "CRITICAL"
}
REVERSE_CLASS_MAPPING = {v: k for k, v in CLASS_MAPPING.items()}

def train_and_evaluate_model(n_samples: int = 6000, random_seed: int = 42):
    """
    Trains the Random Forest model on the synthetic mining dataset,
    evaluates performance metrics, and persists artifacts.
    """
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    print(f"Generating synthetic dataset with {n_samples} samples...")
    raw_df = generate_synthetic_mine_dataset(n_samples=n_samples, random_seed=random_seed)
    
    print("Extracting multi-sensor features...")
    X_df = extract_features_df(raw_df)
    y_raw = raw_df["label"].values
    y = np.array([REVERSE_CLASS_MAPPING[label] for label in y_raw])
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_df[FEATURE_NAMES], y, test_size=0.2, random_state=random_seed, stratify=y
    )
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        class_weight="balanced",
        random_state=random_seed,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="macro"))
    rec = float(recall_score(y_test, y_pred, average="macro"))
    f1 = float(f1_score(y_test, y_pred, average="macro"))
    
    # Specific Critical Recall (Class 2)
    crit_mask = (y_test == REVERSE_CLASS_MAPPING["CRITICAL"])
    crit_recall = float(np.sum((y_pred[crit_mask] == REVERSE_CLASS_MAPPING["CRITICAL"])) / np.sum(crit_mask))
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Feature importances
    importances = model.feature_importances_
    feat_importance_list = [
        {"feature": name, "importance": float(imp)}
        for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    ]
    
    metrics = {
        "model_name": "Random Forest Classifier",
        "total_samples": len(raw_df),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(acc * 100, 2),
        "precision_macro": round(prec * 100, 2),
        "recall_macro": round(rec * 100, 2),
        "f1_macro": round(f1 * 100, 2),
        "critical_recall": round(crit_recall * 100, 2),
        "classes": ["NORMAL", "ANOMALOUS", "CRITICAL"],
        "confusion_matrix": cm,
        "feature_importances": feat_importance_list,
        "last_trained_at": datetime.utcnow().isoformat(),
        "is_synthetic_dataset": True,
        "disclaimer": "Trained on synthetic prototype data modeling mine environmental anomalies. Not certified for actual mine deployment."
    }
    
    # Save model and metrics
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    
    print(f"Saving metrics to {METRICS_PATH}...")
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Model trained successfully! Accuracy: {metrics['accuracy']}%, Critical Recall: {metrics['critical_recall']}%")
    return model, metrics

if __name__ == "__main__":
    train_and_evaluate_model()
