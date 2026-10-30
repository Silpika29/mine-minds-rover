import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { ReportRecord, Patrol } from '../types';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [selectedPatrolId, setSelectedPatrolId] = useState<number | null>(null);

  const fetchReportsAndPatrols = async () => {
    try {
      const [rptRes, ptlRes] = await Promise.all([
        apiClient.get('/reports'),
        apiClient.get('/patrols'),
      ]);
      setReports(rptRes.data);
      setPatrols(ptlRes.data);
      if (ptlRes.data.length > 0 && !selectedPatrolId) {
        setSelectedPatrolId(ptlRes.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching reports', e);
    }
  };

  useEffect(() => {
    fetchReportsAndPatrols();
  }, []);

  const handleGenerateReport = async (format: 'PDF' | 'CSV') => {
    if (!selectedPatrolId) return;
    setGenerating(true);
    try {
      const res = await apiClient.post('/reports/generate', {
        patrol_id: selectedPatrolId,
        format: format,
      });
      fetchReportsAndPatrols();
      if (format === 'PDF') {
        window.open(`http://localhost:8000/api/reports/${res.data.id}/download`, '_blank');
      } else {
        window.open(`http://localhost:8000/api/reports/${res.data.id}/csv`, '_blank');
      }
    } catch (e) {
      console.error('Error generating report', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Automated Patrol Inspection Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official compliance documentation, downloadable PDF summaries & raw CSV data
          </p>
        </div>

        {/* Generate Report Form */}
        <div className="flex items-center space-x-2 bg-[#0A1124] p-1.5 rounded-xl border border-[#1E2E4E]">
          <select
            value={selectedPatrolId || ''}
            onChange={(e) => setSelectedPatrolId(Number(e.target.value))}
            className="bg-[#080D1A] border border-[#1E2E4E] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {patrols.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patrol_number} ({p.final_status})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleGenerateReport('PDF')}
            disabled={generating || !selectedPatrolId}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate PDF</span>
          </button>

          <button
            onClick={() => handleGenerateReport('CSV')}
            disabled={generating || !selectedPatrolId}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Generated Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="mission-card p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Reports Generated Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a patrol above to generate a new official inspection PDF or export CSV.
            </p>
          </div>
        ) : (
          reports.map((r) => {
            const isPdf = r.format === 'PDF';
            return (
              <div
                key={r.id}
                className="mission-card p-4 mission-card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isPdf ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white text-xs">{r.report_code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPdf ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {r.format}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm mt-0.5">{r.title}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center space-x-3">
                      <span>Generated: {new Date(r.created_at).toLocaleString()}</span>
                      <span>&bull;</span>
                      <span>By: {r.generated_by}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={isPdf ? `http://localhost:8000/api/reports/${r.id}/download` : `http://localhost:8000/api/reports/${r.id}/csv`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#080D1A] hover:bg-slate-800 border border-[#1E2E4E] text-cyan-400 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {r.format}</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
