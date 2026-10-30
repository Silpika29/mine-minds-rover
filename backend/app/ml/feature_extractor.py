import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union

FEATURE_NAMES = [
    "gas_current",
    "gas_average",
    "gas_max",
    "gas_min",
    "gas_rate",
    "gas_std",
    "gas_change",
    "co_current",
    "co_average",
    "co_max",
    "co_min",
    "co_rate",
    "co_change",
    "temperature_current",
    "temperature_average",
    "temperature_rate",
    "humidity_current",
    "water_status",
    "vibration_current",
    "vibration_average",
    "vibration_std",
    "battery",
    "communication_health"
]

def extract_features_from_window(
    ch4_window: List[float],
    co_window: List[float],
    temp_window: List[float],
    hum_window: List[float],
    vib_window: List[float],
    water_window: List[Union[bool, int]],
    batt_window: List[float],
    comm_health: float = 1.0,
    time_delta_seconds: float = 2.0
) -> Dict[str, float]:
    """
    Extracts rolling window statistical and trend features for ML classification.
    """
    ch4_arr = np.array(ch4_window, dtype=float)
    co_arr = np.array(co_window, dtype=float)
    temp_arr = np.array(temp_window, dtype=float)
    hum_arr = np.array(hum_window, dtype=float)
    vib_arr = np.array(vib_window, dtype=float)
    water_arr = np.array(water_window, dtype=float)
    batt_arr = np.array(batt_window, dtype=float)
    
    n_points = len(ch4_arr)
    total_time = max(1.0, (n_points - 1) * time_delta_seconds)

    # Methane (CH4) features
    gas_current = float(ch4_arr[-1])
    gas_average = float(np.mean(ch4_arr))
    gas_max = float(np.max(ch4_arr))
    gas_min = float(np.min(ch4_arr))
    gas_rate = float((ch4_arr[-1] - ch4_arr[0]) / total_time) # ppm/second
    gas_std = float(np.std(ch4_arr)) if n_points > 1 else 0.0
    gas_change = float(ch4_arr[-1] - ch4_arr[-2]) if n_points > 1 else 0.0

    # Carbon Monoxide (CO) features
    co_current = float(co_arr[-1])
    co_average = float(np.mean(co_arr))
    co_max = float(np.max(co_arr))
    co_min = float(np.min(co_arr))
    co_rate = float((co_arr[-1] - co_arr[0]) / total_time)
    co_change = float(co_arr[-1] - co_arr[-2]) if n_points > 1 else 0.0

    # Temperature features
    temperature_current = float(temp_arr[-1])
    temperature_average = float(np.mean(temp_arr))
    temperature_rate = float((temp_arr[-1] - temp_arr[0]) / total_time)

    # Humidity & Water
    humidity_current = float(hum_arr[-1])
    water_status = float(water_arr[-1] if len(water_arr) > 0 else 0.0)

    # Vibration features
    vibration_current = float(vib_arr[-1])
    vibration_average = float(np.mean(vib_arr))
    vibration_std = float(np.std(vib_arr)) if n_points > 1 else 0.0

    # Battery & Comm
    battery = float(batt_arr[-1])
    communication_health = float(comm_health)

    return {
        "gas_current": gas_current,
        "gas_average": gas_average,
        "gas_max": gas_max,
        "gas_min": gas_min,
        "gas_rate": gas_rate,
        "gas_std": gas_std,
        "gas_change": gas_change,
        "co_current": co_current,
        "co_average": co_average,
        "co_max": co_max,
        "co_min": co_min,
        "co_rate": co_rate,
        "co_change": co_change,
        "temperature_current": temperature_current,
        "temperature_average": temperature_average,
        "temperature_rate": temperature_rate,
        "humidity_current": humidity_current,
        "water_status": water_status,
        "vibration_current": vibration_current,
        "vibration_average": vibration_average,
        "vibration_std": vibration_std,
        "battery": battery,
        "communication_health": communication_health,
    }

def extract_features_df(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, row in df.iterrows():
        feat = extract_features_from_window(
            ch4_window=row["ch4_seq"],
            co_window=row["co_seq"],
            temp_window=row["temp_seq"],
            hum_window=row["hum_seq"],
            vib_window=row["vib_seq"],
            water_window=row["water_seq"],
            batt_window=row["batt_seq"],
            comm_health=row.get("comm_health", 1.0)
        )
        rows.append(feat)
    return pd.DataFrame(rows)
