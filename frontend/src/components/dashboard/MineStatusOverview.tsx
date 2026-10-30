import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { RiskGauge } from '../common/RiskGauge';
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, Battery, Radio, Route, Bell } from 'lucide-react';
import { SafetyStatusType } from '../../types';

interface MineStatusOverviewProps {
  status?: SafetyStatusType | string;
  roverCode?: string;
  zoneCode?: string;
  zoneName?: string;
  battery?: number | null;
  patrolStatus?: string;
  activeAlertsCount?: number;
  riskScore?: number;
  lastPing?: string;
  currentHazardText?: string;
}

export const MineStatusOverview: React.FC<MineStatusOverviewProps> = ({
  status = 'NORMAL',
  roverCode = 'ROVER-01',
  zoneCode = 'ZONE-03',
  zoneName = 'Tunnel B Longwall Heading',
  battery = null,
  patrolStatus = 'OFFLINE',
  activeAlertsCount = 0,
  riskScore = 8,
  lastPing,
  currentHazardText
}) => {
  const normStatus = (status || 'NORMAL').toUpperCase();

  const getStatusColor = () => {
    if (normStatus === 'CRITICAL' || normStatus === 'ALERT') return 'border-red-500/80 bg-red-950/20 text-red-400';
    if (normStatus === 'ANOMALOUS' || normStatus === 'WARNING') return 'border-amber-500/80 bg-amber-950/20 text-amber-400';
    return 'border-emerald-500/80 bg-emerald-950/20 text-emerald-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Mine Status Card */}
      <div className={`mission-card p-5 border-l-4 ${getStatusColor()} flex items-center justify-between`}>
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold block mb-1">
            Current Mine Status
          </span>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              {normStatus}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium truncate max-w-[200px]">
            {currentHazardText || (normStatus === 'NORMAL' ? 'All sectors operating nominally' : 'Atmospheric gradient detected')}
          </p>
        </div>
        <StatusBadge status={status} size="lg" />
      </div>

      {/* 2. Rover & Sector Location */}
      <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            Active Rover Position
          </span>
          <MapPin className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <span>{roverCode}</span>
            <span className="text-xs font-normal text-slate-400">&bull;</span>
            <span className="text-cyan-400 text-sm font-semibold">{zoneCode}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{zoneName}</p>
        </div>
        <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Battery: <strong className="text-slate-200">{battery !== null ? `${battery.toFixed(0)}%` : 'N/A — Not Connected'}</strong></span>
          <span className={battery !== null ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{battery !== null ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* 3. Patrol & Telemetry Health */}
      <div className="mission-card p-5 mission-card-hover flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            Patrol Cycle Status
          </span>
          <Route className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-white font-mono">
            {patrolStatus}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Autonomous Waypoint Navigation</p>
        </div>
        <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Active Alerts: <strong className={activeAlertsCount > 0 ? "text-amber-400" : "text-emerald-400"}>{activeAlertsCount}</strong></span>
          <span>Comm Link: <strong className={battery !== null ? "text-emerald-400" : "text-slate-400"}>{battery !== null ? "ONLINE" : "OFFLINE"}</strong></span>
        </div>
      </div>

      {/* 4. AI Composite Risk Gauge */}
      <div className="mission-card p-4 mission-card-hover flex items-center justify-center">
        <RiskGauge score={riskScore} size={130} label="AI RISK INDEX" />
      </div>
    </div>
  );
};
