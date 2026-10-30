import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { apiClient } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Activity, Clock } from 'lucide-react';

interface LiveSensorChartProps {
  roverCode?: string;
}

export const LiveSensorChart: React.FC<LiveSensorChartProps> = ({ roverCode = 'ROVER-01' }) => {
  const { liveData } = useSocket();
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '30m' | '1h' | '24h'>('5m');
  const [activeMetric, setActiveMetric] = useState<'ch4' | 'co' | 'temp' | 'vib' | 'all'>('ch4');
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch historical data on timeframe change
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/sensors/history?rover_code=${roverCode}&timeframe=${timeframe}`);
        const formatted = res.data.map((r: any) => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          methane: r.methane_ppm,
          co: r.co_ppm,
          temperature: r.temperature_c,
          vibration: r.vibration_g,
          battery: r.battery_pct,
          risk: r.risk_score
        }));
        setChartData(formatted);
      } catch (e) {
        console.error('Failed to fetch sensor history', e);
      }
    };
    fetchHistory();
  }, [timeframe, roverCode]);

  // Append new WebSocket readings live
  useEffect(() => {
    if (liveData) {
      setChartData((prev) => {
        const nextItem = {
          time: new Date(liveData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          methane: liveData.readings.methane,
          co: liveData.readings.co,
          temperature: liveData.readings.temperature,
          vibration: liveData.readings.vibration,
          battery: liveData.readings.battery,
          risk: liveData.risk_score
        };
        const updated = [...prev, nextItem];
        return updated.length > 60 ? updated.slice(updated.length - 60) : updated;
      });
    }
  }, [liveData]);

  const timescales: Array<'1m' | '5m' | '30m' | '1h' | '24h'> = ['1m', '5m', '30m', '1h', '24h'];

  return (
    <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E]">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E2E4E]">
        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-[#1A2640]">
          <button
            onClick={() => setActiveMetric('ch4')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'ch4'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Methane (CH4)
          </button>
          <button
            onClick={() => setActiveMetric('co')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'co'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Carbon Monoxide
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'temp'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveMetric('vib')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'vib'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vibration
          </button>
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeMetric === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Gas
          </button>
        </div>

        {/* Timescale Selector */}
        <div className="flex items-center space-x-1 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {timescales.map((ts) => (
            <button
              key={ts}
              onClick={() => setTimeframe(ts)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                timeframe === ts
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-[#0E172A] text-slate-400 hover:text-slate-200 border border-[#1E2E4E]'
              }`}
            >
              {ts}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4E" opacity={0.5} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B132B',
                borderColor: '#1E2E4E',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

            {/* Threshold reference lines */}
            {activeMetric === 'ch4' && (
              <>
                <ReferenceLine y={500} label={{ value: "Warn: 500ppm", fill: "#F59E0B", fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />
                <ReferenceLine y={1000} label={{ value: "Crit: 1000ppm", fill: "#EF4444", fontSize: 10 }} stroke="#EF4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="methane" name="CH4 (ppm)" stroke="#F59E0B" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </>
            )}

            {activeMetric === 'co' && (
              <>
                <ReferenceLine y={50} label={{ value: "Warn: 50ppm", fill: "#F59E0B", fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />
                <ReferenceLine y={150} label={{ value: "Crit: 150ppm", fill: "#EF4444", fontSize: 10 }} stroke="#EF4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="co" name="CO (ppm)" stroke="#06B6D4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </>
            )}

            {activeMetric === 'temp' && (
              <>
                <ReferenceLine y={35} label={{ value: "Warn: 35°C", fill: "#F59E0B", fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F97316" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </>
            )}

            {activeMetric === 'vib' && (
              <>
                <ReferenceLine y={0.5} label={{ value: "Warn: 0.50g", fill: "#F59E0B", fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />
                <ReferenceLine y={1.0} label={{ value: "Crit: 1.00g", fill: "#EF4444", fontSize: 10 }} stroke="#EF4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="vibration" name="Vibration (g)" stroke="#A855F7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </>
            )}

            {activeMetric === 'all' && (
              <>
                <Line type="monotone" dataKey="methane" name="CH4 (ppm)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="co" name="CO (ppm)" stroke="#06B6D4" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="risk" name="Risk Index" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
