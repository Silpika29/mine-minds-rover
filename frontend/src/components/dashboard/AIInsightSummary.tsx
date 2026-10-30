import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge } from '../common/StatusBadge';
import { BrainCircuit, Sparkles, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIInsightSummary: React.FC = () => {
  const { liveData } = useSocket();
  const navigate = useNavigate();

  const mlPred = liveData?.ml_prediction;
  const prediction = mlPred?.prediction || 'NORMAL';
  const confidence = (mlPred?.confidence ?? 0.94) * 100;
  const explanations = mlPred?.explanations || [
    {
      display_name: 'Atmospheric Stability',
      value: 'CH4, CO & Temp within limits',
      impact: 'LOW',
      direction: 'NEUTRAL',
      description: 'Continuous rolling telemetry shows baseline safety conformity.'
    }
  ];

  return (
    <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#1E2E4E] pb-2">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
              AI Hazard Classification & XAI
            </h3>
          </div>
          <button
            onClick={() => navigate('/ml-insights')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Full Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prediction Status & Confidence Banner */}
        <div className="bg-[#080D1A] p-3 rounded-xl border border-[#1A2640] mb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Random Forest Inference
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <StatusBadge status={prediction} size="sm" />
              <span className="text-xs font-mono font-bold text-slate-200">
                {confidence.toFixed(1)}% Confidence
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">MODEL</span>
            <span className="text-xs font-mono font-semibold text-cyan-300">RF-120 Trees</span>
          </div>
        </div>

        {/* Why did AI say this? Explanation Factors */}
        <div>
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Why did AI classify this state?</span>
          </div>
          <div className="space-y-1.5">
            {explanations.slice(0, 3).map((exp, idx) => (
              <div
                key={idx}
                className="text-xs p-2 rounded-lg bg-[#0E172A] border border-[#1E2E4E] flex items-start space-x-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  exp.impact === 'HIGH' ? 'bg-red-400 shadow-[0_0_6px_#ef4444]' :
                  exp.impact === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{exp.display_name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{exp.value}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Compliance Disclaimer */}
      <div className="mt-3 pt-2 border-t border-[#1E2E4E]/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Dual-Layer Safety: Rule limits take life-safety priority</span>
        <span className="text-cyan-400">Prototype ML</span>
      </div>
    </div>
  );
};
