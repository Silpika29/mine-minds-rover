import React, { useState } from 'react';
import { apiClient } from '../../services/api';
import { Play, Flame, Layers, AlertOctagon, WifiOff, BatteryWarning, CheckCircle2, RotateCcw } from 'lucide-react';

interface ScenarioControlBarProps {
  currentMode?: string;
  onScenarioChange?: (mode: string) => void;
}

export const ScenarioControlBar: React.FC<ScenarioControlBarProps> = ({
  currentMode = 'NORMAL',
  onScenarioChange,
}) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'NORMAL',
      label: '1. Normal Patrol',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      desc: 'Baseline nominal readings across all zones',
      color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400',
      activeColor: 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    },
    {
      id: 'METHANE_RISING',
      label: '2. Methane Rising',
      icon: <Flame className="w-3.5 h-3.5" />,
      desc: 'Gradual CH4 climb (Zone 03) -> Anomalous status & ML early warning',
      color: 'hover:border-amber-500/60 hover:bg-amber-500/10 text-amber-400',
      activeColor: 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    },
    {
      id: 'MULTI_SENSOR_ANOMALY',
      label: '3. Multi-Sensor Anomaly',
      icon: <Layers className="w-3.5 h-3.5" />,
      desc: 'Combined Methane + CO + Temp gradient elevation',
      color: 'hover:border-orange-500/60 hover:bg-orange-500/10 text-orange-400',
      activeColor: 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.3)]',
    },
    {
      id: 'CRITICAL_EMERGENCY',
      label: '4. Critical Emergency',
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
      desc: 'Explosive gas spike + roof vibration -> Emergency Mode & sirens',
      color: 'hover:border-red-500/60 hover:bg-red-500/10 text-red-400',
      activeColor: 'bg-red-500/25 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse',
    },
    {
      id: 'COMM_LOST',
      label: '5. Comm Lost',
      icon: <WifiOff className="w-3.5 h-3.5" />,
      desc: 'Simulate LoRa packet loss & offline warning',
      color: 'hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-400',
      activeColor: 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    },
    {
      id: 'LOW_BATTERY',
      label: '6. Low Battery',
      icon: <BatteryWarning className="w-3.5 h-3.5" />,
      desc: 'Battery drops below 15% -> Return-to-base protocol',
      color: 'hover:border-yellow-500/60 hover:bg-yellow-500/10 text-yellow-400',
      activeColor: 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]',
    },
  ];

  const handleTrigger = async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    try {
      await apiClient.post('/simulator/scenario', { scenario: scenarioId });
      if (onScenarioChange) onScenarioChange(scenarioId);
    } catch (e) {
      console.error('Scenario trigger error', e);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleReset = async () => {
    try {
      await apiClient.post('/simulator/control', { action: 'RESET' });
      if (onScenarioChange) onScenarioChange('NORMAL');
    } catch (e) {
      console.error('Reset error', e);
    }
  };

  return (
    <div className="bg-[#0A1020]/95 border-b border-[#1E2E4E] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      <div className="flex items-center space-x-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
          Hardware Simulator & Demo Scenarios:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {scenarios.map((sc) => {
          const isActive = currentMode === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleTrigger(sc.id)}
              disabled={loadingScenario === sc.id}
              title={sc.desc}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center space-x-1.5 ${
                isActive
                  ? sc.activeColor
                  : `bg-[#0E172A] border-[#1E2E4E] text-slate-300 ${sc.color}`
              }`}
            >
              {sc.icon}
              <span>{sc.label}</span>
            </button>
          );
        })}

        <button
          onClick={handleReset}
          title="Reset Simulator to Normal State"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
