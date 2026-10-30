import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Patrol } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Route, Play, Square, FileText, ArrowRight, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PatrolsPage: React.FC = () => {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { liveData } = useSocket();
  const navigate = useNavigate();

  const fetchPatrols = async () => {
    try {
      const res = await apiClient.get('/patrols');
      setPatrols(res.data);
    } catch (e) {
      console.error('Error fetching patrols', e);
    }
  };

  useEffect(() => {
    fetchPatrols();
  }, []);

  const handleStartPatrol = async () => {
    setLoading(true);
    try {
      await apiClient.post('/patrols/control', { action: 'START' });
      fetchPatrols();
    } catch (e) {
      console.error('Error starting patrol', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStopPatrol = async () => {
    setLoading(true);
    try {
      await apiClient.post('/patrols/control', { action: 'STOP' });
      fetchPatrols();
    } catch (e) {
      console.error('Error stopping patrol', e);
    } finally {
      setLoading(false);
    }
  };

  const activePatrol = patrols.find((p) => p.final_status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Title & Start/Stop Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Route className="w-6 h-6 text-cyan-400" />
            <span>Digital Patrol Records & Logbook</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous mission records, multi-sector hazard timelines, and inspection audits
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {activePatrol ? (
            <button
              onClick={handleStopPatrol}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <Square className="w-4 h-4" />
              <span>Conclude Active Patrol</span>
            </button>
          ) : (
            <button
              onClick={handleStartPatrol}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              <Play className="w-4 h-4" />
              <span>Start New Patrol Mission</span>
            </button>
          )}
        </div>
      </div>

      {/* Patrol Cards Grid */}
      <div className="space-y-3.5">
        {patrols.length === 0 ? (
          <div className="mission-card p-12 text-center flex flex-col items-center justify-center bg-[#0A1124]/50 border-dashed border-[#1E2E4E]">
            <FileText className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-400 font-mono uppercase tracking-widest mb-1">
              NO PATROLS RECORDED
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Start a new patrol mission to begin logging telemetry.
            </p>
          </div>
        ) : (
          patrols.map((p) => {
            const isOngoing = p.final_status === 'IN_PROGRESS';
            return (
              <div
                key={p.id}
                className={`mission-card p-5 transition-all ${
                  isOngoing
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'mission-card-hover'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Meta Information */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-extrabold font-mono text-cyan-300">
                        {p.patrol_number}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        &bull; Assigned: <strong className="text-slate-200">{p.rover_code || 'ROVER-01'}</strong>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        &bull; Mine: <strong className="text-slate-200">{p.mine_name || 'Silver Peak Colliery'}</strong>
                      </span>
                      <StatusBadge status={p.final_status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-300 mt-3">
                      <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                        <span className="text-[10px] text-slate-400 block uppercase">START TIME</span>
                        <span className="font-semibold">{new Date(p.start_time).toLocaleTimeString()}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                        <span className="text-[10px] text-slate-400 block uppercase">DURATION</span>
                        <span className="font-semibold">
                          {Math.floor(p.duration_seconds / 60)}m {p.duration_seconds % 60}s
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                        <span className="text-[10px] text-slate-400 block uppercase">DISTANCE</span>
                        <span className="font-semibold">{p.distance_meters.toFixed(0)}m</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                        <span className="text-[10px] text-slate-400 block uppercase">EVENTS</span>
                        <span className="font-semibold">
                          {p.critical_events_count} Crit &bull; {p.anomalies_count} Anom
                        </span>
                      </div>
                    </div>

                    {/* Zones covered pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="text-[11px] text-slate-400 font-mono mr-1">Inspected Sectors:</span>
                      {p.zones_inspected && p.zones_inspected.length > 0 ? (
                        p.zones_inspected.map((z, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141F36] border border-[#1E2E4E] text-cyan-300"
                          >
                            {z}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">None logged yet</span>
                      )}
                    </div>
                  </div>

                  {/* Right Action: Open Timeline Inspector */}
                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/patrols/${p.id}`)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      <span>View Patrol Timeline & AI Replay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
