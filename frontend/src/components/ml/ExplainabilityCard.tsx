import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { BrainCircuit, Sparkles, AlertTriangle, ShieldCheck, Flame, Wind, Activity, Thermometer } from 'lucide-react';
import { FeatureExplanation } from '../../types';

interface ExplainabilityCardProps {
  prediction: string;
  confidence: number;
  riskScore: number;
  explanations: FeatureExplanation[];
  probabilities?: Record<string, number>;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  prediction = 'NORMAL',
  confidence = 0.94,
  riskScore = 8,
  explanations = [],
  probabilities = { NORMAL: 0.94, ANOMALOUS: 0.05, CRITICAL: 0.01 }
}) => {
  const isCrit = prediction === 'CRITICAL';
  const isAnom = prediction === 'ANOMALOUS';

  return (
    <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Explainable AI (XAI) Diagnostic Engine
            </h3>
            <p className="text-xs text-slate-400">Local feature contribution & multi-sensor trend reasoning</p>
          </div>
        </div>
        <StatusBadge status={prediction} size="md" />
      </div>

      {/* Main Classification & Confidence Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Probabilities */}
        <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1A2640] md:col-span-2 space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
            Predicted Class Distribution
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-semibold">NORMAL</span>
                <span className="text-slate-300">{((probabilities.NORMAL ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(probabilities.NORMAL ?? 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-400 font-semibold">ANOMALOUS</span>
                <span className="text-slate-300">{((probabilities.ANOMALOUS ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(probabilities.ANOMALOUS ?? 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-red-400 font-semibold">CRITICAL</span>
                <span className="text-slate-300">{((probabilities.CRITICAL ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(probabilities.CRITICAL ?? 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Model Confidence Metric Card */}
        <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1A2640] flex flex-col justify-between items-center text-center">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
            Inference Confidence
          </span>
          <div className="my-2">
            <span className="text-3xl font-mono font-extrabold text-cyan-300">
              {(confidence * (confidence <= 1 ? 100 : 1)).toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Composite Risk Score: <strong className="text-white">{riskScore.toFixed(0)}/100</strong>
          </span>
        </div>
      </div>

      {/* WHY DID AI SAY THIS? Detailed Factor Breakdown */}
      <div>
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Why did AI say {prediction}? Contributing Telemetry Factors:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {explanations.map((exp, idx) => {
            const isHigh = exp.impact === 'HIGH';
            const isMod = exp.impact === 'MODERATE';
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isHigh
                    ? 'bg-red-950/20 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                    : isMod
                    ? 'bg-amber-950/15 border-amber-500/50'
                    : 'bg-[#0E172A] border-[#1E2E4E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{exp.display_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isHigh ? 'bg-red-500/20 text-red-300' :
                    isMod ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {exp.impact} IMPACT
                  </span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">
                  Measured Value: {exp.value}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
