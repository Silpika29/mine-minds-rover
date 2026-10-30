import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../services/api';
import { SensorCard } from '../components/dashboard/SensorCard';
import { LiveSensorChart } from '../components/dashboard/LiveSensorChart';
import { WifiStatusPanel } from '../components/dashboard/WifiStatusPanel';
import { Activity, Flame, Wind, Thermometer, Droplets, Battery, Sliders, Layers } from 'lucide-react';
import { SensorReading } from '../types';

export const SensorsPage: React.FC = () => {
  const { liveData } = useSocket();
  const [history, setHistory] = useState<SensorReading[]>([]);

  const fetchRecentHistory = async () => {
    try {
      const res = await apiClient.get('/sensors/history?timeframe=5m&limit=15');
      setHistory(res.data);
    } catch (e) {
      console.error('Failed to load sensor history table', e);
    }
  };

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const lastPingTime = liveData?.last_ping_at;
  const isOffline = !lastPingTime || (new Date().getTime() - new Date(lastPingTime).getTime() > 15000);

  const methane = isOffline ? '-' : (liveData?.readings?.methane ?? '-');
  const co = isOffline ? '-' : (liveData?.readings?.co ?? '-');
  const temp = isOffline ? '-' : (liveData?.readings?.temperature ?? '-');
  const hum = isOffline ? '-' : (liveData?.readings?.humidity ?? '-');
  const vib = isOffline ? '-' : (liveData?.readings?.vibration ?? '-');
  const water = isOffline ? false : (liveData?.readings?.water ?? false);
  const batt = isOffline ? null : (liveData?.readings?.battery ?? null);

  const numMethane = typeof methane === 'number' ? methane : 0;
  const numCo = typeof co === 'number' ? co : 0;
  const numTemp = typeof temp === 'number' ? temp : 0;
  const numHum = typeof hum === 'number' ? hum : 0;
  const numVib = typeof vib === 'number' ? vib : 0;
  const numBatt = typeof batt === 'number' ? batt : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>Live Multi-Sensor Environmental Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time atmospheric gas, thermal, seismic vibration &amp; chassis telemetry stream
          </p>
        </div>
      </div>

      {/* Wi-Fi Connection Status */}
      <WifiStatusPanel />

      {/* 7 Sensor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard
          name="Methane Gas"
          code="CH4"
          value={methane}
          unit="ppm"
          status={isOffline ? 'OFFLINE' : (numMethane >= 1000 ? 'CRITICAL' : numMethane >= 500 ? 'ANOMALOUS' : 'NORMAL')}
          trend={isOffline ? 'STABLE' : (numMethane > 500 ? 'RISING' : 'STABLE')}
          rateOfChange={isOffline ? 0 : 0.8}
          sparkline={isOffline ? [] : [420, 425, 430, numMethane - 10, numMethane]}
          iconType="ch4"
          maxSafe={500}
        />

        <SensorCard
          name="Carbon Monoxide"
          code="CO"
          value={co}
          unit="ppm"
          status={isOffline ? 'OFFLINE' : (numCo >= 150 ? 'CRITICAL' : numCo >= 50 ? 'ANOMALOUS' : 'NORMAL')}
          trend={isOffline ? 'STABLE' : (numCo > 50 ? 'RISING' : 'STABLE')}
          rateOfChange={isOffline ? 0 : 0.2}
          sparkline={isOffline ? [] : [30, 32, 33, numCo - 2, numCo]}
          iconType="co"
          maxSafe={50}
        />

        <SensorCard
          name="Ambient Temp"
          code="TEMP"
          value={temp}
          unit="°C"
          status={isOffline ? 'OFFLINE' : (numTemp >= 45 ? 'CRITICAL' : numTemp >= 35 ? 'ANOMALOUS' : 'NORMAL')}
          trend="STABLE"
          sparkline={isOffline ? [] : [26.8, 27.0, 27.2, numTemp - 0.2, numTemp]}
          iconType="temp"
          maxSafe={35}
        />

        <SensorCard
          name="Relative Humidity"
          code="HUMIDITY"
          value={hum}
          unit="%"
          status={isOffline ? 'OFFLINE' : (numHum >= 85 ? 'ANOMALOUS' : 'NORMAL')}
          trend="STABLE"
          sparkline={isOffline ? [] : [62, 63, 64, numHum - 1, numHum]}
          iconType="hum"
          maxSafe={80}
        />

        <SensorCard
          name="Ground Vibration"
          code="VIBRATION"
          value={vib}
          unit="g"
          status={isOffline ? 'OFFLINE' : (numVib >= 1.0 ? 'CRITICAL' : numVib >= 0.5 ? 'ANOMALOUS' : 'NORMAL')}
          trend={isOffline ? 'STABLE' : (numVib > 0.5 ? 'RISING' : 'STABLE')}
          sparkline={isOffline ? [] : [0.18, 0.20, 0.21, numVib - 0.05, numVib]}
          iconType="vib"
          maxSafe={0.5}
        />

        <SensorCard
          name="Chassis Water"
          code="WATER SENSOR"
          value={isOffline ? '-' : (water ? 'DETECTED' : 'CLEAR')}
          unit=""
          status={isOffline ? 'OFFLINE' : (water ? 'CRITICAL' : 'NORMAL')}
          trend="STABLE"
          sparkline={isOffline ? [] : [0, 0, 0, 0, water ? 1 : 0]}
          iconType="water"
          maxSafe={0}
        />

        <SensorCard
          name="Rover Battery"
          code="BATTERY"
          value={isOffline || batt === null ? 'N/A — Not Connected' : `${numBatt.toFixed(0)}%`}
          unit=""
          status={isOffline || batt === null ? 'OFFLINE' : (numBatt <= 15 ? 'CRITICAL' : 'NORMAL')}
          trend={isOffline ? 'STABLE' : "FALLING"}
          rateOfChange={isOffline ? 0 : -0.05}
          sparkline={isOffline || batt === null ? [] : [95, 94.8, 94.5, numBatt - 0.2, numBatt]}
          iconType="battery"
          minSafe={20}
          maxSafe={100}
        />

        {/* Safety Rule Bounds Quick Card */}
        <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E] flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <Sliders className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase">SAFETY LIMITS</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1 font-mono">
              <div>CH4: &lt;500 / &gt;1000 ppm</div>
              <div>CO: &lt;50 / &gt;150 ppm</div>
              <div>VIB: &lt;0.5 / &gt;1.0 g</div>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono font-semibold pt-2 border-t border-[#1E2E4E]/60">
            Active Rule Engine Layer 1
          </div>
        </div>
      </div>

      {/* Real-Time Line Graph */}
      <div>
        <LiveSensorChart roverCode="ROVER-01" />
      </div>

      {/* Recent Telemetry Raw Packet Log */}
      <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E]">
        <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Recent Ingested Telemetry Packets</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Live Ingestion Buffer</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[#1E2E4E] text-slate-400">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Sector</th>
                <th className="p-2">CH4</th>
                <th className="p-2">CO</th>
                <th className="p-2">Temp</th>
                <th className="p-2">Vibration</th>
                <th className="p-2">Water</th>
                <th className="p-2">Rule Status</th>
                <th className="p-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} className="border-b border-[#1A2640] hover:bg-[#0E172A]">
                  <td className="p-2 text-slate-300">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2 text-cyan-400">ZONE-{r.zone_id}</td>
                  <td className="p-2 font-bold text-amber-400">{r.methane_ppm.toFixed(1)} ppm</td>
                  <td className="p-2 text-slate-300">{r.co_ppm.toFixed(1)} ppm</td>
                  <td className="p-2 text-slate-300">{r.temperature_c.toFixed(1)}°C</td>
                  <td className="p-2 text-slate-300">{r.vibration_g.toFixed(2)}g</td>
                  <td className="p-2">{r.water_detected ? <span className="text-red-400 font-bold">YES</span> : 'No'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.rule_status === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      r.rule_status === 'WARNING' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {r.rule_status}
                    </span>
                  </td>
                  <td className="p-2 font-bold text-white">{r.risk_score.toFixed(0)}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
