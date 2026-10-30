import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
  classes: string[];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  matrix = [[1200, 0, 0], [0, 500, 0], [0, 0, 300]],
  classes = ['NORMAL', 'ANOMALOUS', 'CRITICAL']
}) => {
  return (
    <div className="mission-card p-5 bg-[#0A1124] border border-[#1E2E4E]">
      <div className="flex items-center justify-between mb-4 border-b border-[#1E2E4E] pb-2">
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Model Confusion Matrix (Validation Set)
          </h3>
          <p className="text-xs text-slate-400">Classification evaluation across 1,200 hold-out test samples</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs font-mono">
          <thead>
            <tr>
              <th className="p-2 text-left font-sans text-slate-400 font-semibold">Actual \ Predicted</th>
              {classes.map((cls) => (
                <th key={cls} className="p-2 text-slate-300 font-bold border-b border-[#1E2E4E]">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((actualClass, rowIdx) => (
              <tr key={actualClass} className="border-b border-[#1A2640]">
                <td className="p-2 text-left font-sans text-slate-300 font-semibold bg-[#080D1A]">
                  {actualClass}
                </td>
                {classes.map((predClass, colIdx) => {
                  const count = matrix[rowIdx] ? matrix[rowIdx][colIdx] ?? 0 : 0;
                  const isDiagonal = rowIdx === colIdx;
                  return (
                    <td
                      key={predClass}
                      className={`p-3 font-bold ${
                        isDiagonal
                          ? actualClass === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : actualClass === 'ANOMALOUS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : count > 0
                          ? 'bg-rose-950/40 text-rose-300 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
