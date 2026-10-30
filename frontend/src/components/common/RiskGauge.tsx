import React from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number; // 0 - 100
  size?: number;
  label?: string;
  showCategory?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score = 0,
  size = 140,
  label = "RISK SCORE",
  showCategory = true
}) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  // Determine Category & Color
  const getCategory = () => {
    if (clampedScore >= 81) return { text: "CRITICAL", color: "#EF4444", bg: "rgba(239, 68, 68, 0.2)" };
    if (clampedScore >= 61) return { text: "HIGH", color: "#F97316", bg: "rgba(249, 115, 22, 0.2)" };
    if (clampedScore >= 31) return { text: "MODERATE", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.2)" };
    return { text: "LOW", color: "#10B981", bg: "rgba(16, 185, 129, 0.2)" };
  };

  const cat = getCategory();
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background Arc */}
        <path
          d={`M 12 ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 12} ${size * 0.6}`}
          fill="none"
          stroke="#1E293B"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Animated Progress Arc */}
        <motion.path
          d={`M 12 ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 12} ${size * 0.6}`}
          fill="none"
          stroke={cat.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${cat.color}80)`
          }}
        />
      </svg>

      {/* Central Value */}
      <div className="absolute top-[38%] flex flex-col items-center">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {clampedScore.toFixed(0)}
          <span className="text-xs text-slate-400 font-sans ml-0.5">/100</span>
        </span>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-[-2px]">
            {label}
          </span>
        )}
      </div>

      {/* Category Pill */}
      {showCategory && (
        <span
          className="mt-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-wider"
          style={{ color: cat.color, backgroundColor: cat.bg }}
        >
          {cat.text}
        </span>
      )}
    </div>
  );
};
