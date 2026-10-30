import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  Video, 
  Camera, 
  Maximize2, 
  Flame, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye, 
  SunMedium, 
  Radio, 
  Compass,
  RotateCcw
} from 'lucide-react';

interface LiveCameraFeedProps {
  customStreamUrl?: string;
  showOverlay?: boolean;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  customStreamUrl,
  showOverlay = true,
}) => {
  const { liveData } = useSocket();
  const [nightVision, setNightVision] = useState<boolean>(false);
  const [ptzAngle, setPtzAngle] = useState<{ pan: number; tilt: number }>({ pan: 0, tilt: 0 });

  const roverCode = liveData?.rover_code || 'ROVER-01';
  const zoneName = liveData?.zone_name || 'Tunnel B - Zone 03';
  const lastPingTime = liveData?.last_ping_at;
  const isSimulated = Boolean(liveData?.is_simulated);
  const hasRealData = lastPingTime && (new Date().getTime() - new Date(lastPingTime).getTime() <= 15000) && liveData?.readings?.methane !== undefined && liveData?.readings?.methane !== null;
  const isOffline = !hasRealData;

  const ch4 = isOffline ? null : liveData?.readings?.methane;
  const co = isOffline ? null : liveData?.readings?.co;
  const temp = isOffline ? null : liveData?.readings?.temperature;
  const water = isOffline ? null : liveData?.readings?.water;

  const handlePan = (dx: number) => {
    setPtzAngle((prev) => ({ ...prev, pan: Math.max(-45, Math.min(45, prev.pan + dx)) }));
  };

  const handleTilt = (dy: number) => {
    setPtzAngle((prev) => ({ ...prev, tilt: Math.max(-30, Math.min(30, prev.tilt + dy)) }));
  };

  return (
    <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Rover ESP32-CAM Live Feed & HUD
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isSimulated && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SIMULATED TELEMETRY
            </span>
          )}
          <button
            onClick={() => setNightVision(!nightVision)}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
              nightVision
                ? 'bg-emerald-500 text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{nightVision ? 'IR Night Vision ON' : 'IR Vision'}</span>
          </button>
        </div>
      </div>

      {/* Video / Canvas Viewport */}
      <div className={`relative w-full h-80 rounded-xl overflow-hidden border border-[#1E2E4E] flex items-center justify-center select-none ${
        nightVision ? 'bg-[#031c08]' : 'bg-[#060A14]'
      }`}>
        {/* Simulated Camera Feed Graphic */}
        {customStreamUrl ? (
          <img
            src={customStreamUrl}
            alt="Live Camera Feed"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 space-y-3 z-10 text-slate-400">
            <Camera className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
            <span className="font-mono font-bold tracking-widest text-slate-500">CAMERA OFFLINE</span>
            <span className="text-xs font-mono">ESP32-CAM NOT CONNECTED</span>
          </div>
        )}

        {/* HUD Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border border-cyan-500/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
          </div>
        </div>

        {/* Top-Left Live Status HUD */}
        <div className="absolute top-3 left-3 bg-[#0B132B]/85 border border-[#1E2E4E] px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-200">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-bold">REC &bull; LIVE STREAM</span>
            <span>|</span>
            <span>24 FPS</span>
            <span>|</span>
            <span className="text-cyan-400">12ms</span>
          </div>
        </div>

        {/* Top-Right Rover & Location Callout */}
        <div className="absolute top-3 right-3 bg-[#0B132B]/85 border border-[#1E2E4E] px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-200">
          <span className="text-cyan-400 font-bold">{roverCode}</span> &bull; {zoneName}
        </div>

        {/* Bottom Right Telemetry Overlay Cards */}
        {showOverlay && (
          <div className="absolute bottom-3 right-3 bg-[#070D1C]/90 border border-[#1E2E4E] p-2.5 rounded-xl text-xs space-y-1 font-mono min-w-[150px]">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                HUD SENSOR STATUS
              </span>
              {isSimulated && (
                <span className="text-[9px] text-amber-400 font-bold">[SIM]</span>
              )}
            </div>
            {isOffline ? (
              <div className="text-rose-400 font-bold py-2 px-1 text-[11px] text-center">
                Gas Sensor Offline
                <div className="text-[9px] text-slate-500 font-normal mt-0.5">No Data Available</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between space-x-4">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>CH4</span>
                  </span>
                  <span className={`font-bold ${ch4 !== null && ch4 >= 1000 ? 'text-red-400' : ch4 !== null && ch4 >= 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {ch4 !== null ? `${ch4.toFixed(0)} ppm` : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CO</span>
                  </span>
                  <span className={`font-bold ${co !== null && co >= 150 ? 'text-red-400' : co !== null && co >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {co !== null ? `${co.toFixed(0)} ppm` : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span>TEMP</span>
                  </span>
                  <span className="font-bold text-slate-200">
                    {temp !== null ? `${temp.toFixed(1)}°C` : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>WATER</span>
                  </span>
                  <span className={`font-bold ${water ? 'text-red-400' : 'text-emerald-400'}`}>
                    {water !== null ? (water ? 'DETECTED' : 'CLEAR') : 'Offline'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}


        {/* PTZ Pan/Tilt Quick Controls Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-[#070D1C]/90 border border-[#1E2E4E] p-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">PTZ:</span>
          <button
            onClick={() => handlePan(-10)}
            className="px-2 py-1 rounded bg-[#0F172A] hover:bg-slate-700 text-slate-200"
            title="Pan Left"
          >
            &larr;
          </button>
          <button
            onClick={() => handleTilt(-10)}
            className="px-2 py-1 rounded bg-[#0F172A] hover:bg-slate-700 text-slate-200"
            title="Tilt Up"
          >
            &uarr;
          </button>
          <button
            onClick={() => handleTilt(10)}
            className="px-2 py-1 rounded bg-[#0F172A] hover:bg-slate-700 text-slate-200"
            title="Tilt Down"
          >
            &darr;
          </button>
          <button
            onClick={() => handlePan(10)}
            className="px-2 py-1 rounded bg-[#0F172A] hover:bg-slate-700 text-slate-200"
            title="Pan Right"
          >
            &rarr;
          </button>
          <button
            onClick={() => setPtzAngle({ pan: 0, tilt: 0 })}
            className="p-1 rounded bg-[#0F172A] hover:bg-slate-700 text-slate-400"
            title="Center"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
