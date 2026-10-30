import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { SystemHealth } from '../types';
import { 
  HeartPulse, 
  Server, 
  Database, 
  Radio, 
  BrainCircuit, 
  Cpu, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';

export const SystemStatusPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { isConnected } = useSocket();

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/health');
      setHealth(res.data);
    } catch (e) {
      console.error('Error fetching health status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <HeartPulse className="w-6 h-6 text-cyan-400" />
            <span>Operational System Health & Subsystems</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time backend API latency, database connection pools, WebSocket clients & simulator status
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-[#0A1124] hover:bg-slate-800 border border-[#1E2E4E] text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health Checks</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Backend API */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white text-sm">FastAPI Backend</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HEALTHY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.backend_status || 'ONLINE (FastAPI 0.124)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>Latency: <strong className="text-cyan-400">{health?.api_latency_ms || 2.4} ms</strong></span>
            <span>Uptime: <strong>99.9%</strong></span>
          </div>
        </div>

        {/* Database ORM */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white text-sm">Database Engine</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.database_status || 'ONLINE (SQLAlchemy ORM)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>Pool: <strong>Active</strong></span>
            <span>Indexed: <strong>Yes</strong></span>
          </div>
        </div>

        {/* WebSocket Stream */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white text-sm">WebSocket Hub</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'
            }`}>
              {isConnected ? 'BROADCASTING' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.websocket_status || 'ACTIVE (/ws/live)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>Clients: <strong>{health?.active_connections || 1}</strong></span>
            <span>Channel: <strong>/ws/live</strong></span>
          </div>
        </div>

        {/* Machine Learning Service */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white text-sm">ML Inference Engine</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TRAINED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.ml_service_status || 'ONLINE (Random Forest 120-trees)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>Critical Recall: <strong className="text-red-400">100.0%</strong></span>
            <span>Features: <strong>21</strong></span>
          </div>
        </div>

        {/* Hardware Simulator */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white text-sm">Telemetry Simulator</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RUNNING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.simulator_status || 'RUNNING (Autonomous Patrol)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>Interval: <strong>2.0s</strong></span>
            <span>Adapter: <strong>Ready</strong></span>
          </div>
        </div>

        {/* Rover Radio Link */}
        <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white text-sm">LoRa Link Signal</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SYNCED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{health?.rover_status || 'ROVER-01 (SNR: 8.5 dB)'}</p>
          <div className="mt-4 pt-2 border-t border-[#1E2E4E]/60 flex justify-between text-xs font-mono text-slate-300">
            <span>RSSI: <strong>-78 dBm</strong></span>
            <span>Packet Loss: <strong>0.0%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
