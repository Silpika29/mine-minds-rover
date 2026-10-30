import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Mine, Zone } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Building2, Layers, Sliders, MapPin, CheckCircle2, Flame, Wind, Thermometer } from 'lucide-react';

export const MinesPage: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);

  useEffect(() => {
    const fetchMines = async () => {
      try {
        const res = await apiClient.get('/mines');
        setMines(res.data);
      } catch (e) {
        console.error('Error fetching mines', e);
      }
    };
    fetchMines();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>Mine Sites & Sector Threshold Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Underground layout zoning, checkpoint lengths & per-zone safety limits
          </p>
        </div>
      </div>

      {/* Mines List */}
      {mines.map((m) => (
        <div key={m.id} className="space-y-4">
          {/* Mine Header Card */}
          <div className="mission-card p-5 bg-[#0B132B] border border-[#1E2E4E]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    {m.code}
                  </span>
                  <h2 className="text-lg font-bold text-white">{m.name}</h2>
                  <StatusBadge status={m.overall_safety_status || 'NORMAL'} size="sm" />
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{m.location}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                  <span className="text-[10px] text-slate-400 block uppercase">ACTIVE SECTORS</span>
                  <strong className="text-cyan-400">{m.zones?.length || 5} Checkpoints</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                  <span className="text-[10px] text-slate-400 block uppercase">STATUS</span>
                  <strong className="text-emerald-400">{m.status}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Zones Table */}
          <div className="mission-card overflow-hidden">
            <div className="p-3 bg-[#090F20] border-b border-[#1E2E4E] flex items-center space-x-2 text-xs font-mono text-slate-300 font-bold uppercase">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Configured Patrol Sectors & Safety Thresholds</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[#0D1527] text-slate-400 border-b border-[#1E2E4E]">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Sector Code & Name</th>
                    <th className="p-3">Length</th>
                    <th className="p-3">CH4 Limits (Warn / Crit)</th>
                    <th className="p-3">CO Limits (Warn / Crit)</th>
                    <th className="p-3">Temp Limits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2640]">
                  {m.zones?.map((z) => (
                    <tr key={z.id} className="hover:bg-[#0E172A]">
                      <td className="p-3 text-cyan-400 font-bold">CP-0{z.order_index + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-white font-sans text-xs">{z.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{z.code}</div>
                      </td>
                      <td className="p-3 text-slate-300">{z.length_meters} meters</td>
                      <td className="p-3">
                        <span className="text-amber-400 font-bold">&gt;{z.ch4_threshold_warning.toFixed(0)}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-red-400 font-bold">&gt;{z.ch4_threshold_critical.toFixed(0)} ppm</span>
                      </td>
                      <td className="p-3">
                        <span className="text-amber-400 font-bold">&gt;{z.co_threshold_warning.toFixed(0)}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-red-400 font-bold">&gt;{z.co_threshold_critical.toFixed(0)} ppm</span>
                      </td>
                      <td className="p-3">
                        <span className="text-amber-400 font-bold">&gt;{z.temp_threshold_warning.toFixed(0)}°C</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-red-400 font-bold">&gt;{z.temp_threshold_critical.toFixed(0)}°C</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
