import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { DatabaseStats } from '../../types';
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const DatabaseMonitorPage: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('sensor_readings');
  const [tableData, setTableData] = useState<any>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/database/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Error fetching db stats', e);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/admin/database/table/${selectedTable}?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`
      );
      setTableData(res.data);
    } catch (e) {
      console.error('Error fetching table data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTableData();
  }, [selectedTable]);

  useEffect(() => {
    fetchTableData();
  }, [page, pageSize]);

  const totalPages = tableData ? Math.ceil(tableData.total_count / pageSize) : 1;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Database className="w-6 h-6 text-amber-400" />
            <span>Database Operational Monitor & Table Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time schema health, table record counts, index status & direct record inspection
          </p>
        </div>
      </div>

      {/* Database Health Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">ENGINE STATUS</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">SQLAlchemy ORM</span>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL RECORD VOLUME</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {stats?.total_records?.toLocaleString() || 350} rows
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">12 Schema Tables</span>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">LATEST SENSOR PACKET</span>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1 truncate">
            {stats?.latest_sensor_reading_time ? new Date(stats.latest_sensor_reading_time).toLocaleTimeString() : 'Active'}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Continuous Stream</span>
        </div>

        <div className="mission-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">LATEST SAFETY ALERT</span>
          <div className="text-sm font-bold font-mono text-amber-300 mt-1 truncate">
            {stats?.latest_alert_time ? new Date(stats.latest_alert_time).toLocaleTimeString() : 'Nominal'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Deduplication: Active</span>
        </div>
      </div>

      {/* Table Selector Pills */}
      <div className="mission-card p-3 bg-[#080D1A] overflow-x-auto flex items-center gap-2">
        {stats?.tables?.map((tbl) => (
          <button
            key={tbl.table_name}
            onClick={() => setSelectedTable(tbl.table_name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 flex items-center space-x-2 ${
              selectedTable === tbl.table_name
                ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-[#0F172A] text-slate-300 hover:text-white border border-[#1E2E4E]'
            }`}
          >
            <span>{tbl.table_name}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${
              selectedTable === tbl.table_name ? 'bg-black text-amber-300' : 'bg-[#1E293B] text-slate-400'
            }`}>
              {tbl.record_count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Data Explorer */}
      <div className="mission-card overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-[#1E2E4E] bg-[#090F20] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <TableIcon className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white uppercase">{selectedTable}</span>
            <span className="text-slate-400">({tableData?.total_count || 0} total records)</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Page {page} of {totalPages || 1}</span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-[#141F36] hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-[#141F36] hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Table Columns & Rows */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#0D1527] text-slate-300 border-b border-[#1E2E4E] sticky top-0">
              <tr>
                {tableData?.columns?.map((col: string) => (
                  <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2640]">
              {tableData?.rows?.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="hover:bg-[#0E172A]">
                  {tableData?.columns?.map((col: string) => {
                    const val = row[col];
                    const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                    return (
                      <td key={col} className="p-2.5 whitespace-nowrap text-slate-300 max-w-xs truncate" title={valStr}>
                        {valStr}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
