import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface FeatureImportanceBarProps {
  features: { feature: string; importance: number }[];
}

export const FeatureImportanceBar: React.FC<FeatureImportanceBarProps> = ({ features = [] }) => {
  const topFeatures = features.slice(0, 10).map((f) => ({
    name: f.feature.replace(/_/g, ' '),
    importance: +(f.importance * 100).toFixed(2),
  }));

  return (
    <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
      <div className="flex items-center justify-between mb-4 border-b border-[#1E2E4E] pb-2">
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Top Random Forest Feature Importances
          </h3>
          <p className="text-xs text-slate-400">Gini impurity reduction across 120 decision trees</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={topFeatures}
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <XAxis type="number" stroke="#64748B" unit="%" tick={{ fill: '#64748B', fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94A3B8"
              tick={{ fill: '#CBD5E1', fontSize: 10, fontFamily: 'monospace' }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B132B',
                borderColor: '#1E2E4E',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
              formatter={(val: any) => [`${val}%`, 'Relative Weight']}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {topFeatures.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#EF4444' : index < 3 ? '#F59E0B' : '#06B6D4'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
