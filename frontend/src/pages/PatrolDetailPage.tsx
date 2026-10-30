import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Patrol } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Route, 
  Flame, 
  Compass 
} from 'lucide-react';

export const PatrolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patrol, setPatrol] = useState<Patrol | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await apiClient.get(`/patrols/${id}`);
        setPatrol(res.data);
      } catch (e) {
        console.error('Error loading patrol details', e);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!patrol) return;
    setDownloading(true);
    try {
      // Trigger generate/download
      const res = await apiClient.post('/reports/generate', {
        patrol_id: patrol.id,
        format: 'PDF',
      });
      const reportId = res.data.id;
      window.open(`http://localhost:8000/api/reports/${reportId}/download`, '_blank');
    } catch (e) {
      console.error('PDF download failed', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!patrol) return;
    try {
      const res = await apiClient.post('/reports/generate', {
        patrol_id: patrol.id,
        format: 'CSV',
      });
      const reportId = res.data.id;
      window.open(`http://localhost:8000/api/reports/${reportId}/csv`, '_blank');
    } catch (e) {
      console.error('CSV export failed', e);
    }
  };

  if (!patrol) {
    return (
      <div className="mission-card p-12 text-center text-slate-400">
        <p className="text-sm">Loading Patrol #{id} telemetry timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/patrols')}
            className="p-2 rounded-xl bg-[#080D1A] hover:bg-slate-800 border border-[#1E2E4E] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold text-white font-mono">
                {patrol.patrol_number}
              </h1>
              <StatusBadge status={patrol.final_status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rover: {patrol.rover_code || 'ROVER-01'} &bull; Started {new Date(patrol.start_time).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-[#080D1A] hover:bg-slate-800 border border-[#1E2E4E] text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>{downloading ? 'Building PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">MISSION DURATION</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {Math.floor(patrol.duration_seconds / 60)}m {patrol.duration_seconds % 60}s
          </div>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL DISTANCE</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {patrol.distance_meters.toFixed(0)} meters
          </div>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">SECTORS INSPECTED</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {patrol.zones_inspected ? patrol.zones_inspected.length : 0} Sectors
          </div>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">HAZARD INCIDENTS</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {patrol.critical_events_count} Crit / {patrol.anomalies_count} Anom
          </div>
        </div>
      </div>

      {/* Chronological Visual Patrol Timeline */}
      <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
        <div className="flex items-center space-x-2 border-b border-[#1E2E4E] pb-3 mb-6">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            Patrol Chronological Event Timeline
          </h3>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E2E4E]">
          {patrol.events && patrol.events.length > 0 ? (
            patrol.events.map((evt, idx) => {
              const isStart = evt.event_type === 'START';
              const isCrit = evt.event_type === 'CRITICAL' || evt.event_type === 'ALERT_TRIGGERED';
              const isAnom = evt.event_type === 'ANOMALY';
              const isComp = evt.event_type === 'COMPLETE';

              return (
                <div key={evt.id || idx} className="relative group">
                  {/* Timeline Point Dot */}
                  <div
                    className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-[#0B132B] ${
                      isCrit ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                      isAnom ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                      isStart || isComp ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
                      'bg-emerald-400'
                    }`}
                  />

                  {/* Event Content Box */}
                  <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1A2640] group-hover:border-cyan-500/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCrit ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                          isAnom ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {evt.event_type}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-300">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        Risk: <strong className="text-white">{evt.risk_score.toFixed(0)}/100</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-medium">
                      {evt.description}
                    </p>

                    {/* Sensor Snapshot if available */}
                    {evt.sensor_snapshot && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
                        {evt.sensor_snapshot.methane && (
                          <span>CH4: <strong className="text-amber-400">{evt.sensor_snapshot.methane.toFixed(0)} ppm</strong></span>
                        )}
                        {evt.sensor_snapshot.co && (
                          <span>CO: <strong className="text-cyan-400">{evt.sensor_snapshot.co.toFixed(0)} ppm</strong></span>
                        )}
                        {evt.sensor_snapshot.temperature && (
                          <span>Temp: <strong className="text-orange-400">{evt.sensor_snapshot.temperature.toFixed(1)}°C</strong></span>
                        )}
                        {evt.sensor_snapshot.vibration && (
                          <span>Vib: <strong className="text-purple-400">{evt.sensor_snapshot.vibration.toFixed(2)}g</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400">No chronological timeline events logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
