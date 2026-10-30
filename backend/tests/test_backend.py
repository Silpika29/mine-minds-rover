import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.database.session import Base, get_db
from app.main import app
from app.services.rule_engine import rule_engine
from app.ml.predictor import predictor
from app.core.security import get_password_hash, verify_password, create_access_token

client = TestClient(app)

def test_password_hashing():
    raw = "supersecret123"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_jwt_token_creation():
    token = create_access_token(subject=1, role="admin")
    assert token is not None
    assert isinstance(token, str)

def test_rule_engine_baseline():
    violations = rule_engine.evaluate(
        methane=420.0,
        co=30.0,
        temperature=26.0,
        humidity=65.0,
        water=False,
        vibration=0.20,
        battery=90.0
    )
    assert len(violations) == 0

def test_rule_engine_critical_methane():
    violations = rule_engine.evaluate(
        methane=1250.0,
        co=30.0,
        temperature=26.0,
        humidity=65.0,
        water=False,
        vibration=0.20,
        battery=90.0
    )
    assert len(violations) > 0
    assert any(v.severity == "CRITICAL" and "METHANE" in v.hazard_type for v in violations)

def test_rule_engine_high_vibration():
    violations = rule_engine.evaluate(
        methane=420.0,
        co=30.0,
        temperature=26.0,
        humidity=65.0,
        water=False,
        vibration=1.35,
        battery=90.0
    )
    assert len(violations) > 0
    assert any(v.severity == "CRITICAL" and "VIBRATION" in v.hazard_type for v in violations)

def test_ml_prediction_and_explainability():
    # Test normal window
    res_normal = predictor.predict(
        ch4_window=[420, 422, 421, 424, 425],
        co_window=[30, 31, 30, 32, 31],
        temp_window=[26, 26.1, 26.2, 26.1, 26.2],
        hum_window=[60, 61, 60, 62, 61],
        vib_window=[0.18, 0.20, 0.19, 0.21, 0.20],
        water_window=[0, 0, 0, 0, 0],
        batt_window=[90, 89.9, 89.8, 89.7, 89.6]
    )
    assert res_normal["prediction"] in ["NORMAL", "ANOMALOUS", "CRITICAL"]
    assert "confidence" in res_normal
    assert "risk_score" in res_normal
    assert "explanations" in res_normal
    assert len(res_normal["explanations"]) > 0

    # Test critical gas escalation window
    res_crit = predictor.predict(
        ch4_window=[600, 800, 1100, 1400, 1650],
        co_window=[50, 90, 140, 190, 220],
        temp_window=[30, 34, 38, 42, 47],
        hum_window=[60, 65, 70, 75, 80],
        vib_window=[0.2, 0.4, 0.7, 1.1, 1.5],
        water_window=[0, 0, 1, 1, 1],
        batt_window=[85, 84, 83, 82, 81]
    )
    assert res_crit["prediction"] == "CRITICAL"
    assert res_crit["risk_score"] >= 80.0

def test_api_login_success():
    res = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_api_sensors_latest():
    res = client.get("/api/sensors/latest")
    assert res.status_code == 200
    data = res.json()
    assert "methane" in data
    assert "co" in data
    assert "temperature" in data
    assert "vibration" in data

def test_api_mines_list():
    res = client.get("/api/mines")
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) > 0
    assert "zones" in mines[0]

def test_api_patrols_list():
    res = client.get("/api/patrols")
    assert res.status_code == 200
    patrols = res.json()
    assert len(patrols) > 0

def test_api_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["backend_status"].startswith("ONLINE")
    assert data["database_status"] == "ONLINE"
