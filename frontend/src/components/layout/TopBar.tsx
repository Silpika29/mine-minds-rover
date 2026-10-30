import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { AudioToggle } from '../common/AudioToggle';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Radio, 
  Battery, 
  MapPin, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldAlert,
  HardHat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, liveData, lastAlert, activeEmergency } = useSocket();
  const navigate = useNavigate();

  const lastPingTime = liveData?.last_ping_at;
  const isOffline = !lastPingTime || (new Date().getTime() - new Date(lastPingTime).getTime() > 15000);

  const roverCode = isOffline ? 'ROVER-01 (Offline)' : (liveData?.rover_code || 'ROVER-01');
  const zoneName = isOffline ? 'Unknown' : (liveData?.zone_name || 'Entry Portal');
  const rawBattery = liveData?.readings?.battery;
  const batteryPct = (isOffline || rawBattery === undefined || rawBattery === null) ? null : rawBattery;
  const hazardStatus = isOffline ? 'OFFLINE' : (liveData?.hazard_status || 'NORMAL');

  return (
    <header className="h-16 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#1E2E4E] px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Mine Portal */}
      <div className="flex items-center space-x-4">
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
                Mining Safety Rover
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono">
                AI OPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Silver Peak Deep Colliery (Mine-Alpha)</p>
          </div>
        </div>
      </div>

      {/* Center Rover Status Telemetry HUD */}
      <div className="hidden md:flex items-center space-x-5 bg-[#070D1C]/80 border border-[#1E2E4E] px-4 py-1.5 rounded-xl">
        {/* Connection Pulse */}
        <div className="flex items-center space-x-1.5" title={isConnected ? "LoRa Gateway Online" : "Gateway Offline"}>
          <Radio className={`w-4 h-4 ${isConnected ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
          <span className="text-xs font-mono font-medium text-slate-300">
            {isConnected ? "LORA LINK" : "DISCONNECTED"}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Current Rover Location */}
        <div className="flex items-center space-x-1.5" title="Current Rover Checkpoint">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            {roverCode} &bull; {zoneName}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Battery Level */}
        <div className="flex items-center space-x-1.5" title={`Battery Level: ${batteryPct !== null ? batteryPct.toFixed(1) + '%' : 'N/A — Not Connected'}`}>
          <Battery className={`w-4 h-4 ${batteryPct !== null && batteryPct <= 20 ? "text-red-400 animate-pulse" : batteryPct !== null ? "text-emerald-400" : "text-slate-500"}`} />
          <span className="text-xs font-mono font-medium text-slate-200">
            {batteryPct !== null ? `${batteryPct.toFixed(0)}%` : 'N/A — Not Connected'}
          </span>
        </div>


        <div className="h-4 w-px bg-slate-700" />

        {/* Live Safety Status */}
        <StatusBadge status={hazardStatus} size="sm" />
      </div>

      {/* Right User Controls & Alerts */}
      <div className="flex items-center space-x-3">
        {/* Audio Mute/Unmute */}
        <AudioToggle />

        {/* Alerts Center shortcut */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="View Active Safety Alerts"
        >
          <Bell className="w-4 h-4" />
          {lastAlert && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          )}
        </button>

        {/* User Role Badge & Dropdown */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/60">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.full_name || 'Operator'}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">
              {user?.role?.name || 'SUPERVISOR'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
