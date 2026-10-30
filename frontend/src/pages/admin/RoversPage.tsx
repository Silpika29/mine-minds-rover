import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Rover } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Cpu, Battery, Radio, MapPin, CheckCircle2, ShieldCheck, Video } from 'lucide-react';

export const RoversPage: React.FC = () => {
  const [rovers, setRovers] = useState<Rover[]>([]);

  useEffect(() => {
    const fetchRovers = async () => {
      try {
        const res = await apiClient.get('/rovers');
        setRovers(res.data);
      } catch (e) {
        console.error('Error fetching rovers', e);
      }
    };
    fetchRovers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Cpu className="w-6 h-6 text-purple-400" />
            <span>Autonomous Rover Fleet & Hardware Status</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Robotic rover units, firmware telemetry, battery diagnostics & radio communication links
          </p>
        </div>
      </div>

      {/* Rover Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rovers.map((r) => (
          <div key={r.id} className="mission-card p-5 bg-[#0B132B] border border-[#1E2E4E] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold font-mono">
                  {r.code.split('-')[1] || '01'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{r.name}</h3>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{r.code}</span>
                </div>
              </div>
              <StatusBadge status={r.hazard_status} size="sm" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <span className="text-[10px] text-slate-400 block uppercase">CURRENT SECTOR</span>
                <strong className="text-cyan-300">{r.current_zone_code || 'ZONE-03'}</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <span className="text-[10px] text-slate-400 block uppercase">BATTERY LEVEL</span>
                <strong className={r.battery_level <= 20 ? 'text-red-400' : 'text-emerald-400'}>
                  {r.battery_level.toFixed(1)}%
                </strong>
              </div>

              <div className="p-2.5 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <span className="text-[10px] text-slate-400 block uppercase">FIRMWARE</span>
                <strong className="text-slate-200">{r.firmware_version}</strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#080D1A] border border-[#1A2640] flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center space-x-2">
                <Radio className={`w-4 h-4 ${r.is_online ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
                <span>Link State: <strong className={r.is_online ? 'text-emerald-400' : 'text-red-400'}>{r.is_online ? 'CONNECTED' : 'OFFLINE'}</strong></span>
              </div>
              <span>Status: <strong className="text-white">{r.status}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
