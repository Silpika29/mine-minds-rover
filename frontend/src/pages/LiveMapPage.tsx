import React, { useState, useEffect } from 'react';
import { DigitalMineMap } from '../components/map/DigitalMineMap';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../services/api';
import { Map, Radio, Compass, ShieldAlert, Route, Layers, Info } from 'lucide-react';
import { Zone } from '../types';

export const LiveMapPage: React.FC = () => {
  const { liveData } = useSocket();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('ZONE-03');

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await apiClient.get('/mines/1/zones');
        setZones(res.data);
      } catch (e) {
        console.error('Error loading zones', e);
      }
    };
    fetchZones();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Map className="w-6 h-6 text-cyan-400" />
            <span>Digital Mine Tunnel & Patrol Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Predefined zone checkpoints, animated rover localization & hazard zoning
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="p-2 rounded-xl bg-[#0A1124] border border-[#1E2E4E] flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Tracking: <strong>ROVER-01</strong></span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div>
        <DigitalMineMap
          interactive={true}
          selectedZoneCode={selectedZone}
          onSelectZone={(code) => setSelectedZone(code)}
        />
      </div>

      {/* Sector Overview Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Underground Mine Sectors & Checkpoints</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {zones.map((z, idx) => {
            const isRoverHere = z.code === (liveData?.zone_code || 'ZONE-03');
            return (
              <div
                key={z.id}
                onClick={() => setSelectedZone(z.code)}
                className={`mission-card p-4 cursor-pointer transition-all ${
                  isRoverHere
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'mission-card-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold bg-[#141F36] text-cyan-300 px-2 py-0.5 rounded border border-[#1E2E4E]">
                    CP-0{idx + 1}
                  </span>
                  {isRoverHere && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                      ROVER HERE
                    </span>
                  )}
                </div>

                <div className="font-bold text-white text-xs mt-1 truncate">{z.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{z.code}</div>

                <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Length: {z.length_meters}m</span>
                  <span>Limits: &lt;{z.ch4_threshold_warning.toFixed(0)}ppm</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Positioning Architecture Note */}
      <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1E2E4E] text-xs text-slate-400 flex items-start space-x-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-200">Hardware Modular Architecture:</div>
          <p className="mt-0.5 leading-relaxed">
            The digital mine map currently utilizes predefined checkpoint zoning with autonomous sequence interpolation. 
            The adapter interface is engineered to directly ingest real LiDAR/SLAM/UWB localization telemetry packets without altering the map state manager.
          </p>
        </div>
      </div>
    </div>
  );
};
