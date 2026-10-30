import React, { useState } from 'react';
import { LiveCameraFeed } from '../components/camera/LiveCameraFeed';
import { useSocket } from '../context/SocketContext';
import { SensorCard } from '../components/dashboard/SensorCard';
import { Video, Settings2, ShieldCheck, Flame, Wind, Thermometer, Droplets, Activity, Battery } from 'lucide-react';

export const CameraPage: React.FC = () => {
  const { liveData } = useSocket();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const methane = liveData?.readings?.methane ?? 434.0;
  const co = liveData?.readings?.co ?? 35.0;
  const temp = liveData?.readings?.temperature ?? 27.5;
  const hum = liveData?.readings?.humidity ?? 64.0;
  const vib = liveData?.readings?.vibration ?? 0.22;
  const water = liveData?.readings?.water ?? false;
  const batt = liveData?.readings?.battery ?? 94.0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Video className="w-6 h-6 text-cyan-400" />
            <span>ESP32-CAM Live Video Stream & HUD Overlay</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual reconnaissance, PTZ servo telemetry, IR night vision & environmental sensor overlay
          </p>
        </div>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="px-3.5 py-1.5 rounded-xl bg-[#0A1124] hover:bg-slate-800 border border-[#1E2E4E] text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <span>Configure Hardware Stream URL</span>
        </button>
      </div>

      {/* Stream URL Config Drawer */}
      {isConfigOpen && (
        <div className="mission-card p-4 bg-[#080D1A] border-cyan-500/40">
          <label className="text-xs font-bold text-slate-200 block mb-1 font-mono uppercase">
            Physical ESP32-CAM / MJPEG Video URL:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="http://192.168.1.100:81/stream (Leave empty for realistic internal simulation)"
              className="flex-1 bg-[#050810] border border-[#1E2E4E] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              Apply Stream
            </button>
          </div>
        </div>
      )}

      {/* Main Layout: Camera Viewport + Parallel Sensor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Camera Screen */}
        <div className="lg:col-span-2">
          <LiveCameraFeed customStreamUrl={streamUrl || undefined} />
        </div>

        {/* Right 1 Col: Telemetry HUD Stack */}
        <div className="space-y-3">
          <SensorCard
            name="Methane Gas"
            code="CH4"
            value={methane}
            unit="ppm"
            status={methane >= 1000 ? 'CRITICAL' : methane >= 500 ? 'ANOMALOUS' : 'NORMAL'}
            trend={methane > 500 ? 'RISING' : 'STABLE'}
            sparkline={[420, 425, 430, methane - 10, methane]}
            iconType="ch4"
            maxSafe={500}
          />

          <SensorCard
            name="Carbon Monoxide"
            code="CO"
            value={co}
            unit="ppm"
            status={co >= 150 ? 'CRITICAL' : co >= 50 ? 'ANOMALOUS' : 'NORMAL'}
            trend={co > 50 ? 'RISING' : 'STABLE'}
            sparkline={[30, 32, 33, co - 2, co]}
            iconType="co"
            maxSafe={50}
          />

          <SensorCard
            name="Ambient Temp"
            code="TEMP"
            value={temp}
            unit="°C"
            status={temp >= 45 ? 'CRITICAL' : temp >= 35 ? 'ANOMALOUS' : 'NORMAL'}
            trend="STABLE"
            sparkline={[26.8, 27.0, 27.2, temp - 0.2, temp]}
            iconType="temp"
            maxSafe={35}
          />

          <SensorCard
            name="Ground Vibration"
            code="VIB"
            value={vib}
            unit="g"
            status={vib >= 1.0 ? 'CRITICAL' : vib >= 0.5 ? 'ANOMALOUS' : 'NORMAL'}
            trend={vib > 0.5 ? 'RISING' : 'STABLE'}
            sparkline={[0.18, 0.20, 0.21, vib - 0.05, vib]}
            iconType="vib"
            maxSafe={0.5}
          />
        </div>
      </div>
    </div>
  );
};
