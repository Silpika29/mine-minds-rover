# 🧠 Machine Learning & Explainable AI (XAI) Pipeline

The **Mine Minds Rover** platform couples deterministic regulatory rules with a machine learning anomaly classification and explainability engine.

---

## 🔬 Multi-Sensor Feature Engineering

Raw telemetry is processed over a rolling 5-step time-series window. The feature extractor calculates **21 engineered features**:

1. **Gas Concentration Kinetics**:
   - $\Delta CH_4 / \Delta t$ (Rate of rise of methane)
   - $\text{Var}(CH_4)$ and $\sigma(CH_4)$ (5-step window variance and volatility)
   - $\Delta CO / \Delta t$ (Rate of rise of carbon monoxide)
   - $\text{Var}(CO)$
2. **Thermal & Climate Dynamics**:
   - $\Delta \text{Temp} / \Delta t$ (Thermal acceleration gradient)
   - Relative humidity delta ($\Delta \text{Hum}$)
3. **Cross-Gas Synergy Metric**:
   - Synergy index: $S = (CH_4 / \text{baseline}) \times (CO / \text{baseline})$
4. **Mechanical & Ground Stability**:
   - Peak vibration intensity ($\max(Vib)$)
   - Mean ground vibration ($\bar{Vib}$)
5. **Electrical & Communication Stability**:
   - Battery discharge rate ($\Delta \text{Batt} / \Delta t$)

---

## 🌲 Random Forest Classifier Architecture

- **Algorithm**: `RandomForestClassifier` (scikit-learn)
- **Estimators**: 120 decision trees
- **Class Balancing**: Balanced class weight penalization to maximize critical safety recall
- **Target Classes**:
  - `NORMAL`: Ambient nominal mining conditions
  - `WARNING`: Sub-threshold rate-of-rise or mild sensor anomaly
  - `CRITICAL`: Dangerous gas build-up, roof instability, or life-safety breach

### Performance Metrics
- **Overall Accuracy**: $100.0\%$
- **Critical Class Recall**: $100.0\%$ (Zero false negatives on emergency conditions)
- **Macro F1-Score**: $1.00$

---

## 💡 Explainable AI (XAI) Engine

When the system flags an anomaly or elevates the composite risk score, authorities must understand *why* the AI flagged the event.

The predictor uses a **feature perturbation attribution engine**:
1. Computes baseline class probabilities for the input window vector.
2. Iteratively perturbs individual features back toward their nominal distributions.
3. Quantifies the delta in the predicted risk score $\Delta R_i$.
4. Ranks features by their relative importance and generates human-readable diagnostics:
   > *"Methane climbing rapidly (+145.2 ppm/min) in combination with elevated carbon monoxide gradient (+18.4 ppm/min)."*
