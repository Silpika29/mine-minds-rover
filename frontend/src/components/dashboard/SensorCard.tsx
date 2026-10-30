import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Flame, 
  Wind, 
  Thermometer, 
  Droplets, 
  Activity, 
  Battery, 
  Radio 
} from 'lucide-react';

interface SensorCardProps {
  name: string;
  code: string;
  value: number | string;
  unit: string;
  status: 'NORMAL' | 'ANOMALOUS' | 'CRITICAL' | string;
  trend: 'RISING' | 'FALLING' | 'STABLE' | string;
  rateOfChange?: number;
  sparkline?: number[];
  iconType: 'ch4' | 'co' | 'temp' | 'hum' | 'vib' | 'water' | 'battery';
  minSafe?: number;
  maxSafe?: number;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  code,
  value,
  unit,
  status,
  trend,
  rateOfChange,
  sparkline = [],
  iconType,
  minSafe,
  maxSafe
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'ch4': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'co': return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'temp': return <Thermometer className="w-4 h-4 text-orange-400" />;
      case 'hum': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'vib': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'water': return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'battery': return <Battery className="w-4 h-4 text-emerald-400" />;
      default: return <Radio className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendIcon = () => {
    if (trend === 'RISING') {
      return (
        <span className="flex items-center text-[11px] font-mono text-rose-400 font-semibold">
          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
          {rateOfChange !== undefined ? `${rateOfChange > 0 ? '+' : ''}${rateOfChange}` : 'Rising'}
        </span>
      );
    }
    if (trend === 'FALLING') {
      return (
        <span className="flex items-center text-[11px] font-mono text-emerald-400 font-semibold">
          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
          {rateOfChange !== undefined ? `${rateOfChange}` : 'Falling'}
        </span>
      );
    }
    return (
      <span className="flex items-center text-[11px] font-mono text-slate-400">
        <Minus className="w-3.5 h-3.5 mr-0.5" />
        Stable
      </span>
    );
  };

  // Sparkline path generator
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const minVal = Math.min(...sparkline);
    const maxVal = Math.max(...sparkline);
    const range = maxVal - minVal || 1;
    const width = 80;
    const height = 24;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = status === 'CRITICAL' ? '#EF4444' : status === 'ANOMALOUS' ? '#F59E0B' : '#10B981';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const isCrit = status === 'CRITICAL';
  const isAnom = status === 'ANOMALOUS';

  return (
    <div className={`mission-card p-4 transition-all duration-200 ${
      isCrit ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
      isAnom ? 'border-amber-500/60 bg-amber-950/15' : 'mission-card-hover'
    }`}>
      {/* Top row: Name & Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E2E4E]">
            {getIcon()}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase block">
              {name}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {code}
            </span>
          </div>
        </div>
        <StatusBadge status={status} size="sm" showIcon={false} />
      </div>

      {/* Main Metric Value & Trend */}
      <div className="flex items-baseline justify-between mt-3">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-mono font-extrabold text-white tracking-tight">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-xs font-sans font-medium text-slate-400">
            {unit}
          </span>
        </div>
        <div>
          {getTrendIcon()}
        </div>
      </div>

      {/* Bottom Sparkline & Safe Range */}
      <div className="mt-3 pt-2.5 border-t border-[#1E2E4E]/60 flex items-center justify-between">
        <div className="text-[10px] font-mono text-slate-400">
          {maxSafe !== undefined ? `Safe: <${maxSafe} ${unit}` : 'Baseline Active'}
        </div>
        <div className="shrink-0">
          {renderSparkline()}
        </div>
      </div>
    </div>
  );
};
