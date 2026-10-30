from typing import Dict, Any, List, Optional
from app.models.mine import Zone

class RuleViolation:
    def __init__(self, hazard_type: str, severity: str, title: str, description: str, factors: List[str]):
        self.hazard_type = hazard_type
        self.severity = severity # 'WARNING' or 'CRITICAL'
        self.title = title
        self.description = description
        self.factors = factors

class SafetyRuleEngine:
    """
    Layer 1: Deterministic Immediate Safety Rule Engine.
    Takes precedence for immediate life-safety actions.
    """
    
    @staticmethod
    def evaluate(
        methane: float,
        co: float,
        temperature: float,
        humidity: float,
        water: bool,
        vibration: float,
        battery: float,
        zone: Optional[Zone] = None
    ) -> List[RuleViolation]:
        violations = []
        
        # Zone-specific threshold overrides or system defaults
        ch4_warn = zone.ch4_threshold_warning if zone else 500.0
        ch4_crit = zone.ch4_threshold_critical if zone else 1000.0
        co_warn = zone.co_threshold_warning if zone else 50.0
        co_crit = zone.co_threshold_critical if zone else 150.0
        temp_warn = zone.temp_threshold_warning if zone else 35.0
        temp_crit = zone.temp_threshold_critical if zone else 45.0

        # 1. Methane (CH4) Rules
        if methane >= ch4_crit:
            violations.append(RuleViolation(
                hazard_type="METHANE_CRITICAL",
                severity="CRITICAL",
                title="Critical Explosive Methane Concentration Detected",
                description=f"Methane concentration at {methane:.1f} ppm exceeds explosive safety limit ({ch4_crit:.0f} ppm). Immediate evacuation advisory.",
                factors=[f"CH4 Level: {methane:.1f} ppm (Threshold: {ch4_crit:.0f} ppm)"]
            ))
        elif methane >= ch4_warn:
            violations.append(RuleViolation(
                hazard_type="METHANE_WARNING",
                severity="WARNING",
                title="Elevated Methane Concentration",
                description=f"Methane level at {methane:.1f} ppm exceeds early warning threshold ({ch4_warn:.0f} ppm).",
                factors=[f"CH4 Level: {methane:.1f} ppm (Threshold: {ch4_warn:.0f} ppm)"]
            ))

        # 2. Carbon Monoxide (CO) Rules
        if co >= co_crit:
            violations.append(RuleViolation(
                hazard_type="CO_TOXIC_CRITICAL",
                severity="CRITICAL",
                title="Toxic Carbon Monoxide Level Detected",
                description=f"CO level at {co:.1f} ppm exceeds lethal occupational safety limit ({co_crit:.0f} ppm).",
                factors=[f"CO Level: {co:.1f} ppm (Threshold: {co_crit:.0f} ppm)"]
            ))
        elif co >= co_warn:
            violations.append(RuleViolation(
                hazard_type="CO_WARNING",
                severity="WARNING",
                title="Elevated Carbon Monoxide Level",
                description=f"Carbon monoxide level at {co:.1f} ppm is above baseline ({co_warn:.0f} ppm).",
                factors=[f"CO Level: {co:.1f} ppm"]
            ))

        # 3. Vibration / Structural Instability Rules
        if vibration >= 1.0:
            violations.append(RuleViolation(
                hazard_type="SEISMIC_VIBRATION_CRITICAL",
                severity="CRITICAL",
                title="Severe Ground / Structural Vibration",
                description=f"Vibration level at {vibration:.2f}g indicates severe seismic anomaly or imminent tunnel roof fall.",
                factors=[f"Vibration: {vibration:.2f}g (Limit: 1.00g)"]
            ))
        elif vibration >= 0.5:
            violations.append(RuleViolation(
                hazard_type="VIBRATION_WARNING",
                severity="WARNING",
                title="Elevated Acoustic/Structural Vibration",
                description=f"Vibration level at {vibration:.2f}g exceeds standard operating baseline.",
                factors=[f"Vibration: {vibration:.2f}g"]
            ))

        # 4. Temperature Rules
        if temperature >= temp_crit:
            violations.append(RuleViolation(
                hazard_type="THERMAL_CRITICAL",
                severity="CRITICAL",
                title="Extreme Thermal / Smoldering Fire Warning",
                description=f"Ambient temperature at {temperature:.1f}°C indicates severe overheating or subsurface combustion.",
                factors=[f"Temperature: {temperature:.1f}°C"]
            ))
        elif temperature >= temp_warn:
            violations.append(RuleViolation(
                hazard_type="TEMPERATURE_WARNING",
                severity="WARNING",
                title="Elevated Ambient Temperature",
                description=f"Temperature at {temperature:.1f}°C is elevated.",
                factors=[f"Temperature: {temperature:.1f}°C"]
            ))

        # 5. Water Ingress / Flooding Rules
        if water:
            violations.append(RuleViolation(
                hazard_type="WATER_INGRESS",
                severity="WARNING",
                title="Sub-surface Water Ingress Detected",
                description="Standing water or sump level increase sensed at rover wheels.",
                factors=["Chassis Water Sensor Triggered"]
            ))

        # 6. Low Battery Safety Rule
        if battery <= 15.0:
            violations.append(RuleViolation(
                hazard_type="BATTERY_LOW",
                severity="WARNING",
                title="Rover Low Battery Warning",
                description=f"Rover battery level is at {battery:.1f}%. Automatic return-to-base protocol recommended.",
                factors=[f"Battery: {battery:.1f}%"]
            ))

        return violations

rule_engine = SafetyRuleEngine()
