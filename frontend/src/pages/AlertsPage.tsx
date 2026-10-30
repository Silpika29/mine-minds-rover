import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Alert } from '../types';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  Search, 
  Video, 
  MapPin, 
  Send, 
  Clock, 
  CheckCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const { lastAlert } = useSocket();
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      let url = '/alerts?limit=50';
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (severityFilter !== 'ALL') url += `&severity=${severityFilter}`;
      const res = await apiClient.get(url);
      setAlerts(res.data);
    } catch (e) {
      console.error('Error loading alerts', e);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, lastAlert]);

  const handleAcknowledge = async (id: number) => {
    try {
      await apiClient.post(`/alerts/${id}/acknowledge`, {});
      fetchAlerts();
    } catch (e) {
      console.error('Acknowledge error', e);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlertId || !resolutionNotes.trim()) return;

    try {
      await apiClient.post(`/alerts/${resolvingAlertId}/resolve`, {
        resolution_notes: resolutionNotes,
      });
      setResolvingAlertId(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (e) {
      console.error('Resolve error', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Safety Alerts & Hazard Response Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident management, rule violation logs, and response dispatch
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-[#0A1124] p-1 rounded-xl border border-[#1E2E4E]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All States
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-red-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('ACKNOWLEDGED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'ACKNOWLEDGED' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Acknowledged
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'RESOLVED' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Grid / Table */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="mission-card p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Incidents Matching Filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              Atmospheric and ground conditions are within normal safety operating bounds.
            </p>
          </div>
        ) : (
          alerts.map((a) => {
            const isCrit = a.severity === 'CRITICAL';
            const isAck = a.status === 'ACKNOWLEDGED';
            const isRes = a.status === 'RESOLVED';

            return (
              <div
                key={a.id}
                className={`mission-card p-4 transition-all ${
                  isCrit && !isRes
                    ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : isAck
                    ? 'border-amber-500/60 bg-amber-950/15'
                    : isRes
                    ? 'border-emerald-500/40 bg-emerald-950/10 opacity-80'
                    : 'border-[#1E2E4E]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Icon & Information */}
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      isAck ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {isCrit ? <AlertOctagon className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCrit ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                        }`}>
                          {a.severity}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isRes ? 'bg-emerald-500/20 text-emerald-300' :
                          isAck ? 'bg-amber-500/20 text-amber-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          STATUS: {a.status}
                        </span>
                        <span className="text-xs font-mono text-cyan-400 font-semibold">
                          {a.rover_code || 'ROVER-01'} &bull; {a.zone_name || a.zone_code || 'Mine Sector'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-1">{a.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{a.description}</p>

                      {/* Contributing Factors */}
                      {a.contributing_factors && a.contributing_factors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {a.contributing_factors.map((f, i) => (
                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080D1A] border border-[#1E2E4E] text-slate-300">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Resolution Notes if resolved */}
                      {a.resolution_notes && (
                        <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30">
                          Resolution: {a.resolution_notes} (by {a.resolved_by || 'Supervisor'})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate('/camera')}
                      className="px-3 py-1.5 rounded-lg bg-[#080D1A] hover:bg-slate-800 border border-[#1E2E4E] text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Camera</span>
                    </button>

                    <button
                      onClick={() => navigate('/live-map')}
                      className="px-3 py-1.5 rounded-lg bg-[#080D1A] hover:bg-slate-800 border border-[#1E2E4E] text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Location</span>
                    </button>

                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(a.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                      >
                        Acknowledge
                      </button>
                    )}

                    {a.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setResolvingAlertId(a.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Alert Modal */}
      {resolvingAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0D1527] border border-[#1E2E4E] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
              <span>Resolve Safety Incident #{resolvingAlertId}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide incident resolution actions taken (e.g. auxiliary fan started, miners evacuated, sensor recalibrated).
            </p>

            <form onSubmit={handleResolve} className="space-y-3">
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                required
                rows={3}
                placeholder="Describe corrective actions taken..."
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlertId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
