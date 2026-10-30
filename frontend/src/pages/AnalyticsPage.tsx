import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  Activity, 
  Layers, 
  ShieldAlert, 
  Info 
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [zoneAnalytics, setZoneAnalytics] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [zoneRes, trendRes, insightRes] = await Promise.all([
          apiClient.get('/analytics/zones'),
          apiClient.get('/analytics/trends?hours=24'),
          apiClient.get('/analytics/insights'),
        ]);
        setZoneAnalytics(zoneRes.data);
        setTrends(trendRes.data);
        setInsights(insightRes.data);
      } catch (e) {
        console.error('Error loading analytics', e);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Historical Safety Analytics & Trend Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zone hazard progression, multi-patrol atmospheric patterns & automated safety insights
          </p>
        </div>
      </div>

      {/* Dynamic Automated Natural Language AI Insights */}
      <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
        <div className="flex items-center space-x-2 border-b border-[#1E2E4E] pb-3 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Automated AI Pattern Insights (Calculated from Historical Patrol Records)
            </h3>
            <p className="text-xs text-slate-400">Dynamic trend synthesis without static hardcoding</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((ins, idx) => {
            const isHigh = ins.severity === 'HIGH' || ins.severity === 'CRITICAL';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs ${
                  isHigh
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'bg-[#080D1A] border-[#1E2E4E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="font-bold text-white text-xs">{ins.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                    Confidence: {(ins.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs mt-1">
                  "{ins.message}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Hazard Status & Gas Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {zoneAnalytics.map((z) => {
          return (
            <div key={z.zone_id} className="mission-card p-4 mission-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-[#080D1A] px-2 py-0.5 rounded border border-[#1E2E4E]">
                    {z.code}
                  </span>
                  <StatusBadge status={z.status} size="sm" showIcon={false} />
                </div>
                <h4 className="font-bold text-white text-xs mt-1 truncate">{z.name}</h4>
                <div className="mt-3 space-y-1 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg CH4:</span>
                    <strong className={z.avg_methane >= 500 ? 'text-amber-400' : 'text-slate-200'}>
                      {z.avg_methane.toFixed(0)} ppm
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg CO:</span>
                    <strong className="text-slate-200">{z.avg_co.toFixed(0)} ppm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vibration:</span>
                    <strong className="text-slate-200">{z.avg_vibration.toFixed(2)}g</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Active Alerts: <strong className="text-white">{z.active_alerts}</strong></span>
                <span>Risk: <strong className="text-white">{z.risk_score.toFixed(0)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Progression Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Methane & CO 24h Trend Chart */}
        <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
          <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Methane & Toxic Gas Progression (24h)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4E" opacity={0.5} />
                <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B132B',
                    borderColor: '#1E2E4E',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="methane" name="CH4 (ppm)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="co" name="CO (ppm)" stroke="#06B6D4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vibration & Seismic Acoustic Shocks */}
        <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
          <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Ground Vibration & Structural Stability (24h)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4E" opacity={0.5} />
                <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B132B',
                    borderColor: '#1E2E4E',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="vibration" name="Vibration (g)" stroke="#A855F7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
