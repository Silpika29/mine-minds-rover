# 🏛️ System Architecture

The **Mine Minds Rover** platform is an end-to-end mission control and digital patrol system designed for underground mining safety.

```
+-----------------------------------------------------------------------------------------+
|                                  MINE MINDS ROVER                                       |
|                                                                                         |
|   +--------------------+      +--------------------+      +-------------------------+   |
|   |  Physical Sensors  | ---> |  Hardware Bridge / | ---> |  FastAPI Ingestion API  |   |
|   |  (Arduino / ESP32) |      | Serial-to-HTTP     |      |   (/api/sensors/ingest) |   |
|   +--------------------+      +--------------------+      +-------------------------+   |
|                                                                        |                |
|                                                                        v                |
|   +--------------------+      +--------------------+      +-------------------------+   |
|   | Machine Learning   | <--- |     Dual-Layer     | ---> |   SQLAlchemy Database   |   |
|   | (Random Forest +   |      |   Safety Engine    |      |  (SQLite / PostgreSQL)  |   |
|   | Explainable AI)    |      |   (Rules + ML)     |      +-------------------------+   |
|   +--------------------+      +--------------------+                   |                |
|             \                          /                               v                |
|              \                        /                   +-------------------------+   |
|               v                      v                    |    WebSocket Manager    |   |
|   +----------------------------------------------------+  |       (/ws/live)        |   |
|   |         Mission Control Authority Dashboard        |  +-------------------------+   |
|   | (Digital Map, Telemetry, Patrol History, Siren)    | <------------'                 |
|   +----------------------------------------------------+                                |
+-----------------------------------------------------------------------------------------+
```

---

## 🛡️ Dual-Layer Safety System

Underground mining environments require deterministic life-safety enforcement combined with predictive machine learning intelligence.

```
                    Raw Telemetry Stream
                             |
                             v
           +-----------------------------------+
           |    Dual-Layer Safety Engine       |
           +-----------------------------------+
             /                               \
            /                                 \
           v                                   v
  [ Layer 1: Rules Engine ]          [ Layer 2: ML & XAI Engine ]
  Immediate Regulatory Limits        5-Step Time-Series Window
  - CH4 >= 1000 ppm (CRITICAL)       - 21 Rolling Statistical Features
  - CO >= 150 ppm (CRITICAL)         - Random Forest (120 Trees)
  - Vibration >= 1.0g (CRITICAL)     - 0-100 Composite Risk Index
  - Water Bridge == True             - Feature Perturbation Attribution
  - Temperature >= 45°C              - Human-Readable Explanation
            \                                 /
             \                               /
              v                             v
           +-----------------------------------+
           |    Alert & Evacuation Dispatcher  |
           |   (Cooldown, WebSocket, Sirens)   |
           +-----------------------------------+
```

### Layer 1: Deterministic Safety Rule Engine
Executes deterministic bounds checks on each sensor sample against mining regulatory safety thresholds:
- **Methane ($CH_4$)**: Warning at $\ge 600\text{ ppm}$, Critical at $\ge 1000\text{ ppm}$.
- **Carbon Monoxide ($CO$)**: Warning at $\ge 50\text{ ppm}$, Critical at $\ge 150\text{ ppm}$.
- **Ground Vibration**: Warning at $\ge 0.50\text{g}$, Critical at $\ge 1.0\text{g}$.
- **Sub-floor Water**: Immediate Warning on digital trip.
- **Ambient Temperature**: Warning at $\ge 38^\circ\text{C}$, Critical at $\ge 45^\circ\text{C}$.
- **Battery**: Low warning at $\le 20\%$, Critical at $\le 10\%$.

*Rule engine violations immediately trigger safety alarms and override ML predictions.*

### Layer 2: Machine Learning & Explainable AI (XAI)
Processes a rolling 5-step time-series window across all telemetry channels:
- Computes rate-of-rise, acceleration, cross-sensor variance, and standard deviations.
- Evaluates against a 120-tree Random Forest classifier trained for 100% Critical Recall.
- Produces a continuous composite risk score ($0 - 100$) and ranked explainability factors.
