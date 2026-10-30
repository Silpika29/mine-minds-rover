# 🚀 Deployment Guide

This guide covers running the **Mine Minds Rover** platform locally, with Docker Compose, or on edge hardware.

---

## 🛠️ Prerequisites

- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node 20 & 25)
- **Git**

---

## 💻 Local Development Setup

### 1. Backend Service
```bash
cd backend
python -m pip install -r requirements.txt

# Train the Random Forest model and generate artifacts
python -m app.ml.train_model

# Seed the database with initial users and demonstration records
python seed.py

# Launch FastAPI with live WebSocket support
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 2. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Dashboard URL: `http://localhost:5173`

### 3. Hardware Bridge (Optional for physical sensors)
```bash
cd bridge
pip install -r requirements.txt
python hardware_bridge.py
```

---

## 🐳 Docker Compose (Multi-Container Setup)

To build and run the entire stack with a single command:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🔑 Default Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Shift Supervisor** | `supervisor` | `supervisor123` |
| **Safety Inspector** | `authority` | `authority123` |
