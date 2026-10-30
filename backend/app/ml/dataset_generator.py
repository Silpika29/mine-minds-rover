import numpy as np
import pandas as pd
from typing import Tuple, List, Dict

def generate_synthetic_mine_dataset(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic time-series dataset of mine sensor readings.
    
    IMPORTANT NOTICE:
    This dataset is synthetic prototype data generated for algorithm training, 
    demonstration, and evaluation. It simulates realistic underground mine environmental 
    hazards including methane buildup, toxic gas pockets, ventilation drops, 
    and seismic vibrations, but is not certified for actual mine safety deployment.
    """
    np.random.seed(random_seed)
    
    rows = []
    
    # Proportion of classes: ~60% Normal, ~25% Anomalous, ~15% Critical
    n_normal = int(n_samples * 0.60)
    n_anomalous = int(n_samples * 0.25)
    n_critical = n_samples - n_normal - n_anomalous
    
    # 1. Generate Normal Sequences (Stable baseline)
    for _ in range(n_normal):
        # 5 consecutive window readings
        base_ch4 = np.random.uniform(400, 480)
        base_co = np.random.uniform(20, 45)
        base_temp = np.random.uniform(24, 30)
        base_hum = np.random.uniform(50, 70)
        base_vib = np.random.uniform(0.08, 0.35)
        base_batt = np.random.uniform(40, 98)
        
        ch4_seq = base_ch4 + np.random.normal(0, 5, 5)
        co_seq = base_co + np.random.normal(0, 2, 5)
        temp_seq = base_temp + np.random.normal(0, 0.2, 5)
        hum_seq = base_hum + np.random.normal(0, 0.5, 5)
        vib_seq = np.clip(base_vib + np.random.normal(0, 0.03, 5), 0.05, 0.45)
        water_seq = [0] * 5
        batt_seq = base_batt - np.linspace(0, 0.2, 5)
        
        rows.append({
            "ch4_seq": ch4_seq.tolist(),
            "co_seq": co_seq.tolist(),
            "temp_seq": temp_seq.tolist(),
            "hum_seq": hum_seq.tolist(),
            "vib_seq": vib_seq.tolist(),
            "water_seq": water_seq,
            "batt_seq": batt_seq.tolist(),
            "comm_health": 1.0,
            "label": "NORMAL"
        })
        
    # 2. Generate Anomalous Sequences (Early warning trends, gradient rises)
    for _ in range(n_anomalous):
        anomaly_type = np.random.choice(["methane_gradient", "co_gradient", "temp_rise", "vibration_fluctuation"])
        base_batt = np.random.uniform(30, 90)
        
        if anomaly_type == "methane_gradient":
            start_ch4 = np.random.uniform(450, 520)
            ch4_seq = np.linspace(start_ch4, start_ch4 + np.random.uniform(150, 350), 5) + np.random.normal(0, 8, 5)
            co_seq = np.random.uniform(35, 75, 5)
            temp_seq = np.random.uniform(26, 32, 5)
            vib_seq = np.random.uniform(0.15, 0.45, 5)
            water_seq = [0] * 5
        elif anomaly_type == "co_gradient":
            ch4_seq = np.random.uniform(420, 520, 5)
            start_co = np.random.uniform(40, 65)
            co_seq = np.linspace(start_co, start_co + np.random.uniform(45, 90), 5) + np.random.normal(0, 3, 5)
            temp_seq = np.random.uniform(25, 31, 5)
            vib_seq = np.random.uniform(0.15, 0.45, 5)
            water_seq = [0] * 5
        elif anomaly_type == "temp_rise":
            ch4_seq = np.random.uniform(460, 580, 5)
            co_seq = np.random.uniform(45, 80, 5)
            start_temp = np.random.uniform(28, 33)
            temp_seq = np.linspace(start_temp, start_temp + np.random.uniform(4, 9), 5)
            vib_seq = np.random.uniform(0.2, 0.5, 5)
            water_seq = [0] * 5
        else: # vibration_fluctuation
            ch4_seq = np.random.uniform(420, 500, 5)
            co_seq = np.random.uniform(30, 60, 5)
            temp_seq = np.random.uniform(25, 30, 5)
            vib_seq = np.array([0.2, 0.65, 0.45, 0.78, 0.60]) + np.random.normal(0, 0.05, 5)
            water_seq = [0] * 5
            
        hum_seq = np.random.uniform(55, 78, 5)
        batt_seq = base_batt - np.linspace(0, 0.3, 5)
        comm_health = np.random.choice([1.0, 0.8, 0.9])
        
        rows.append({
            "ch4_seq": ch4_seq.tolist(),
            "co_seq": co_seq.tolist(),
            "temp_seq": temp_seq.tolist(),
            "hum_seq": hum_seq.tolist(),
            "vib_seq": vib_seq.tolist(),
            "water_seq": water_seq,
            "batt_seq": batt_seq.tolist(),
            "comm_health": comm_health,
            "label": "ANOMALOUS"
        })
        
    # 3. Generate Critical Sequences (Explosive CH4, Toxic CO, Roof Collapse Vibration, Flood)
    for _ in range(n_critical):
        crit_type = np.random.choice(["methane_spike", "toxic_co", "roof_collapse", "flooding", "multi_failure"])
        base_batt = np.random.uniform(20, 85)
        
        if crit_type == "methane_spike":
            ch4_seq = np.linspace(700, np.random.uniform(1100, 1850), 5) + np.random.normal(0, 15, 5)
            co_seq = np.random.uniform(50, 120, 5)
            temp_seq = np.random.uniform(28, 36, 5)
            vib_seq = np.random.uniform(0.2, 0.6, 5)
            water_seq = [0] * 5
        elif crit_type == "toxic_co":
            ch4_seq = np.random.uniform(500, 850, 5)
            co_seq = np.linspace(90, np.random.uniform(160, 320), 5) + np.random.normal(0, 5, 5)
            temp_seq = np.random.uniform(30, 42, 5)
            vib_seq = np.random.uniform(0.2, 0.5, 5)
            water_seq = [0] * 5
        elif crit_type == "roof_collapse":
            ch4_seq = np.random.uniform(450, 750, 5)
            co_seq = np.random.uniform(30, 80, 5)
            temp_seq = np.random.uniform(26, 32, 5)
            vib_seq = np.linspace(0.4, np.random.uniform(1.2, 2.8), 5)
            water_seq = [0] * 5
        elif crit_type == "flooding":
            ch4_seq = np.random.uniform(400, 600, 5)
            co_seq = np.random.uniform(30, 60, 5)
            temp_seq = np.random.uniform(22, 28, 5)
            vib_seq = np.random.uniform(0.2, 0.4, 5)
            water_seq = [0, 0, 1, 1, 1]
        else: # multi_failure
            ch4_seq = np.linspace(600, 1350, 5)
            co_seq = np.linspace(60, 190, 5)
            temp_seq = np.linspace(30, 46, 5)
            vib_seq = np.linspace(0.3, 1.4, 5)
            water_seq = [0, 1, 1, 1, 1]
            
        hum_seq = np.random.uniform(60, 95, 5)
        batt_seq = base_batt - np.linspace(0, 0.5, 5)
        comm_health = np.random.choice([1.0, 0.7, 0.5])
        
        rows.append({
            "ch4_seq": ch4_seq.tolist(),
            "co_seq": co_seq.tolist(),
            "temp_seq": temp_seq.tolist(),
            "hum_seq": hum_seq.tolist(),
            "vib_seq": vib_seq.tolist(),
            "water_seq": water_seq,
            "batt_seq": batt_seq.tolist(),
            "comm_health": comm_health,
            "label": "CRITICAL"
        })
        
    df = pd.DataFrame(rows)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df
