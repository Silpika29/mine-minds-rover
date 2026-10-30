import React from 'react';
import { SafetyStatusType } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  status: SafetyStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normStatus = (status || 'NORMAL').toUpperCase();

  const getStyle = () => {
    switch (normStatus) {
      case 'CRITICAL':
      case 'ALERT':
        return {
          bg: 'bg-red-500/20 border-red-500/80 text-red-400',
          dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
          icon: <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />,
          label: 'CRITICAL',
        };
      case 'ANOMALOUS':
      case 'WARNING':
        return {
          bg: 'bg-amber-500/20 border-amber-500/80 text-amber-400',
          dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'ANOMALOUS',
        };
      case 'NORMAL':
      default:
        return {
          bg: 'bg-emerald-500/20 border-emerald-500/80 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          label: 'NORMAL',
        };
    }
  };

  const config = getStyle();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1.5',
    md: 'text-xs px-3 py-1 space-x-2 font-medium tracking-wide',
    lg: 'text-sm px-4 py-1.5 space-x-2.5 font-semibold tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && config.icon}
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
