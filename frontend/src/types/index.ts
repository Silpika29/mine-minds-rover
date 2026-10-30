export type RoleType = 'admin' | 'supervisor' | 'authority';
export type SafetyStatusType = 'NORMAL' | 'ANOMALOUS' | 'CRITICAL';
export type AlertSeverityType = 'WARNING' | 'CRITICAL';
export type AlertStatusType = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type PatrolStatusType = 'IN_PROGRESS' | 'NORMAL' | 'ANOMALOUS' | 'ALERT' | 'ABORTED';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role_id: number;
  assigned_mine_id?: number | null;
  is_active: boolean;
  created_at?: string;
  role: {
    id: number;
    name: RoleType;
    description?: string;
  };
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface Zone {
  id: number;
  mine_id: number;
  code: string;
  name: string;
  order_index: number;
  x_coord: number;
  y_coord: number;
  length_meters: number;
  ch4_threshold_warning: number;
  ch4_threshold_critical: number;
  co_threshold_warning: number;
  co_threshold_critical: number;
  temp_threshold_warning: number;
  temp_threshold_critical: number;
  latest_status?: SafetyStatusType;
  latest_risk_score?: number;
  hazard_count?: number;
}

export interface Mine {
  id: number;
  code: string;
  name: string;
  location: string;
  description?: string;
  status: string;
  zones: Zone[];
  active_rovers_count?: number;
  active_alerts_count?: number;
  overall_safety_status?: SafetyStatusType;
}

export interface Rover {
  id: number;
  code: string;
  name: string;
  mine_id: number;
  mine_name?: string;
  current_zone_id?: number;
  current_zone_code?: string;
  current_zone_name?: string;
  battery_level: number;
  status: 'IDLE' | 'PATROLLING' | 'RETURNING' | 'OFFLINE' | 'EMERGENCY';
  hazard_status: SafetyStatusType;
  firmware_version: string;
  camera_url?: string;
  is_active: boolean;
  is_online: boolean;
  last_ping_at: string;
}

export interface SensorLatestData {
  current: number;
  unit: string;
  status: SafetyStatusType;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  previous: number;
  rate_of_change: number;
  sparkline: number[];
  min_safe: number;
  max_safe: number;
}

export interface SensorsOverview {
  rover_code: string;
  zone_code: string;
  zone_name: string;
  battery_pct: number;
  overall_status: SafetyStatusType;
  risk_score: number;
  last_ping: string;
  methane: SensorLatestData;
  co: SensorLatestData;
  temperature: SensorLatestData;
  humidity: SensorLatestData;
  vibration: SensorLatestData;
  water: SensorLatestData;
  battery: SensorLatestData;
}

export interface SensorReading {
  id: number;
  rover_id: number;
  mine_id: number;
  zone_id: number;
  methane_ppm: number;
  co_ppm: number;
  temperature_c: number;
  humidity_pct: number;
  water_detected: boolean;
  vibration_g: number;
  battery_pct: number;
  rule_status: string;
  ml_status: string;
  risk_score: number;
  timestamp: string;
}

export interface Alert {
  id: number;
  rover_id: number;
  rover_code?: string;
  mine_id: number;
  mine_name?: string;
  zone_id: number;
  zone_code?: string;
  zone_name?: string;
  patrol_id?: number;
  hazard_type: string;
  severity: AlertSeverityType;
  title: string;
  description: string;
  risk_score: number;
  contributing_factors?: string[];
  status: AlertStatusType;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface PatrolEvent {
  id: number;
  patrol_id: number;
  zone_id?: number;
  zone_code?: string;
  zone_name?: string;
  timestamp: string;
  event_type: string;
  description: string;
  risk_score: number;
  sensor_snapshot?: any;
}

export interface Patrol {
  id: number;
  patrol_number: string;
  rover_id: number;
  rover_code?: string;
  mine_id: number;
  mine_name?: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  distance_meters: number;
  zones_inspected: string[];
  normal_events_count: number;
  anomalies_count: number;
  critical_events_count: number;
  final_status: PatrolStatusType;
  notes?: string;
  created_at: string;
  events?: PatrolEvent[];
}

export interface FeatureExplanation {
  feature_name: string;
  display_name: string;
  value: any;
  impact: 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface MLPrediction {
  prediction: SafetyStatusType;
  confidence: number;
  probabilities: {
    NORMAL: number;
    ANOMALOUS: number;
    CRITICAL: number;
  };
  risk_score: number;
  explanations: FeatureExplanation[];
  features: Record<string, number>;
}

export interface MLMetrics {
  model_name: string;
  total_samples: number;
  training_samples: number;
  test_samples: number;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  critical_recall: number;
  classes: string[];
  confusion_matrix: number[][];
  feature_importances: { feature: string; importance: number }[];
  last_trained_at: string;
  is_synthetic_dataset: boolean;
  disclaimer: string;
}

export interface ReportRecord {
  id: number;
  patrol_id: number;
  report_code: string;
  title: string;
  file_path?: string;
  format: 'PDF' | 'CSV';
  generated_by: string;
  summary_json?: any;
  created_at: string;
}

export interface DatabaseStats {
  database_type: string;
  status: string;
  tables: { table_name: string; record_count: number }[];
  total_records: number;
  latest_sensor_reading_time?: string;
  latest_alert_time?: string;
  latest_patrol_time?: string;
}

export interface SystemHealth {
  backend_status: string;
  database_status: string;
  websocket_status: string;
  ml_service_status: string;
  simulator_status: string;
  rover_status: string;
  last_sensor_packet?: string;
  api_latency_ms: number;
  system_time: string;
  active_connections: number;
  memory_usage_mb?: number;
}

export interface SimulatorStatus {
  is_running: boolean;
  current_mode: string;
  current_zone_code: string;
  current_zone_name: string;
  patrol_active: boolean;
  current_patrol_number?: string;
  step_count: number;
  battery_level: number;
  simulated_lora_snr: number;
  simulated_lora_rssi: number;
  last_broadcast_time?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  details?: any;
  status: string;
  timestamp: string;
}
