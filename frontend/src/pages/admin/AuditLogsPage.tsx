import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { AuditLog } from '../../types';
import { Shield, Search, CheckCircle2, AlertCircle, Clock, User } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('');

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get(`/admin/audit-logs${actionFilter ? `?action=${actionFilter}` : ''}`);
      setLogs(res.data);
    } catch (e) {
      console.error('Error fetching audit logs', e);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span>Administrative & Operational Security Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system logs for user authentication, alert acknowledgments, rover commands & configuration updates
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mission-card p-3 flex items-center space-x-3 bg-[#080D1A]">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action name (e.g. LOGIN, ALERT, SCENARIO)..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="mission-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">
            No audit records available
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#090F20] text-slate-400 border-b border-[#1E2E4E] sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource / Parameter</th>
                  <th className="p-3">Change Details</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2640]">
                {logs.map((l) => {
                  const isParamChange = l.action.includes('PARAMETER');
                  const details = l.details || {};
                  const paramName = details.parameter_name || details.parameter || l.resource_id;
                  const prevVal = details.previous_value !== undefined ? String(details.previous_value) : '-';
                  const newVal = details.new_value !== undefined ? String(details.new_value) : '-';

                  return (
                    <tr key={l.id} className="hover:bg-[#0E172A]">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        @{l.username || 'SYSTEM'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isParamChange 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#141F36] text-cyan-300 border border-[#1E2E4E]'
                        }`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-300 font-semibold">
                        {paramName ? paramName : (l.resource_type ? `${l.resource_type} #${l.resource_id || ''}` : '-')}
                      </td>
                      <td className="p-3 text-slate-300 max-w-md text-[11px]">
                        {isParamChange ? (
                          <div className="space-x-2">
                            <span className="text-slate-400">Previous: <strong className="text-rose-300">{prevVal}</strong></span>
                            <span className="text-slate-500">&rarr;</span>
                            <span className="text-slate-400">New: <strong className="text-emerald-300">{newVal}</strong></span>
                          </div>
                        ) : (
                          <span className="text-slate-400">{JSON.stringify(details)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
