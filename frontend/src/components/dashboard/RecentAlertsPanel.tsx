import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Alert } from '../../types';
import { AlertTriangle, AlertOctagon, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecentAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { lastAlert } = useSocket();
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/alerts?status=ACTIVE&limit=5');
      setAlerts(res.data);
    } catch (e) {
      console.error('Error fetching alerts', e);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [lastAlert]);

  const handleAcknowledge = async (id: number) => {
    try {
      await apiClient.post(`/alerts/${id}/acknowledge`, {});
      fetchAlerts();
    } catch (e) {
      console.error('Acknowledge error', e);
    }
  };

  return (
    <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
              Active Safety Incidents ({alerts.length})
            </h3>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Alert Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-300">No Active Critical Incidents</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Atmosphere and seismic metrics nominal</p>
            </div>
          ) : (
            alerts.map((a) => {
              const isCrit = a.severity === 'CRITICAL';
              return (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCrit
                      ? 'bg-red-950/30 border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'bg-amber-950/20 border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {isCrit ? (
                        <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-white text-xs">{a.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{a.description}</div>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-slate-400">
                          <span className="text-cyan-400">{a.zone_name || a.zone_code || 'Mine Sector'}</span>
                          <span>&bull;</span>
                          <span>{new Date(a.created_at).toLocaleTimeString()}</span>
                          <span>&bull;</span>
                          <span className="text-amber-400">Risk: {a.risk_score.toFixed(0)}/100</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="px-2.5 py-1 rounded bg-[#0B132B] hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-semibold transition-colors shrink-0 ml-2"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Automatic cooldown & deduplication active</span>
        <span className="text-emerald-400 font-mono">DEDUP: 60s</span>
      </div>
    </div>
  );
};
