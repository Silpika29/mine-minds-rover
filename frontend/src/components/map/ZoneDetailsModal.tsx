import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { RiskGauge } from '../common/RiskGauge';
import { X, Flame, Wind, Thermometer, Activity, Droplets, AlertTriangle } from 'lucide-react';

interface ZoneDetailsModalProps {
  zone: {
    code: string;
    name: string;
    status: string;
    risk: number;
    desc: string;
    length: string;
  };
  onClose: () => void;
}

export const ZoneDetailsModal: React.FC<ZoneDetailsModalProps> = ({ zone, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0D1527] border border-[#1E2E4E] rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2E4E] flex items-center justify-between bg-[#111C33]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                {zone.code}
              </span>
              <h3 className="font-bold text-slate-100 text-base">{zone.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{zone.desc} &bull; Length: {zone.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status & Risk Summary */}
          <div className="flex items-center justify-between bg-[#080D1A] p-4 rounded-xl border border-[#1A2640]">
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-1">CURRENT STATUS</span>
              <StatusBadge status={zone.status} size="md" />
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div>
              <RiskGauge score={zone.risk} size={110} />
            </div>
          </div>

          {/* Environmental Thresholds & Limits */}
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 mb-2.5">
              Sector Safety Thresholds
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">Methane (CH4)</span>
                </div>
                <div className="text-slate-300">Warn: &gt;500 ppm</div>
                <div className="text-red-400 font-medium">Critical: &gt;1000 ppm</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="font-semibold">Carbon Monoxide</span>
                </div>
                <div className="text-slate-300">Warn: &gt;50 ppm</div>
                <div className="text-red-400 font-medium">Critical: &gt;150 ppm</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <div className="flex items-center space-x-1.5 text-orange-400 mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-semibold">Temperature</span>
                </div>
                <div className="text-slate-300">Warn: &gt;35°C</div>
                <div className="text-red-400 font-medium">Critical: &gt;45°C</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080D1A] border border-[#1A2640]">
                <div className="flex items-center space-x-1.5 text-purple-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold">Vibration / Seismic</span>
                </div>
                <div className="text-slate-300">Warn: &gt;0.50g</div>
                <div className="text-red-400 font-medium">Critical: &gt;1.00g</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2E4E] bg-[#111C33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
