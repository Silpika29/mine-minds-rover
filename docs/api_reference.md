# 📡 API Reference & Integration Guide

The **Mine Minds Rover** backend provides both REST endpoints and real-time WebSockets.

---

## 🔐 Authentication & Security

- **Scheme**: OAuth2 Password Grant with JWT (HMAC-SHA256).
- **Header**: `Authorization: Bearer <access_token>`
- **Roles**:
  - `admin`: Full access (configuration, users, rovers, audit log, DB metrics).
  - `supervisor`: Active patrol management, manual rover control, alert resolution.
  - `authority`: Read-only multi-site compliance auditing, official PDF reports.

---

## 📡 Sensor Ingestion API

### Ingest Hardware Telemetry
```http
POST /api/sensors/ingest
Content-Type: application/json
```

#### Request Payload
```json
{
  "rover_id": "ROVER-01",
  "zone_code": "ZONE-03",
  "methane": 620.5,
  "co": 45.2,
  "temperature": 29.4,
  "humidity": 68.0,
  "water": false,
  "vibration": 0.28,
  "battery": 82.0,
  "timestamp": "2026-10-30T15:00:00Z"
}
```

#### Response (200 OK)
```json
{
  "status": "ACCEPTED",
  "packet_id": 1042,
  "risk_score": 42.5,
  "hazard_level": "MODERATE",
  "rule_violations": []
}
```

---

## 🔄 Real-Time Telemetry Stream (WebSocket)

### Endpoint
```
ws://<backend-host>:8000/ws/live
```

Broadcasts live JSON packets every 2 seconds or immediately on safety alerts:
```json
{
  "type": "TELEMETRY_UPDATE",
  "rover_code": "ROVER-01",
  "zone_code": "ZONE-03",
  "readings": {
    "methane": 620.5,
    "co": 45.2,
    "temperature": 29.4,
    "humidity": 68.0,
    "water": false,
    "vibration": 0.28,
    "battery": 82.0
  },
  "risk_score": 42.5,
  "hazard_status": "MODERATE",
  "timestamp": "2026-10-30T15:00:00.123456"
}
```

---

## 📊 Summary of Core REST Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/token` | User login & JWT issuance | Public |
| `GET` | `/api/health` | Subsystem status (DB, ML, Simulator, WebSockets) | Public |
| `GET` | `/api/sensors/latest` | Latest reading for active rover | Authenticated |
| `GET` | `/api/patrols` | List all past & active patrols | Authenticated |
| `POST` | `/api/patrols/start` | Initiate new patrol mission | Supervisor, Admin |
| `GET` | `/api/alerts` | List active & historical hazard alerts | Authenticated |
| `POST` | `/api/alerts/{id}/resolve` | Acknowledge & clear safety alert | Supervisor, Admin |
| `GET` | `/api/reports/pdf/{patrol_id}` | Download official ReportLab inspection report | Authenticated |
| `POST` | `/api/simulator/scenario` | Switch demonstration scenario | Supervisor, Admin |
