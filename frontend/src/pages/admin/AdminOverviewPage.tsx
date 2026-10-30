import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Route, 
  Server, 
  BrainCircuit, 
  Radio, 
  ArrowRight 
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [dbStats, usersRes, minesRes, roversRes, patrolsRes, alertsRes] = await Promise.all([
          apiClient.get('/admin/database/stats'),
          apiClient.get('/admin/users'),
          apiClient.get('/mines'),
          apiClient.get('/rovers'),
          apiClient.get('/patrols'),
          apiClient.get('/alerts?status=ACTIVE'),
        ]);

        setStats({
          dbStats: dbStats.data,
          users: usersRes.data,
          mines: minesRes.data,
          rovers: roversRes.data,
          patrols: patrolsRes.data,
          activeAlerts: alertsRes.data,
        });
      } catch (e) {
        console.error('Error fetching admin overview', e);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>Administrative Command & Fleet Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System overview, user privileges, mine sector configuration & database health monitoring
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="mission-card p-4 mission-card-hover cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">TOTAL USERS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {stats?.users?.length || 3}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono flex items-center space-x-1 mt-1">
            <span>Manage Users</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/mines')}
          className="mission-card p-4 mission-card-hover cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">MINE SITES</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {stats?.mines?.length || 1}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1 mt-1">
            <span>Configure Sectors</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/rovers')}
          className="mission-card p-4 mission-card-hover cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">ACTIVE ROVERS</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {stats?.rovers?.length || 1}
          </div>
          <span className="text-[10px] text-purple-400 font-mono flex items-center space-x-1 mt-1">
            <span>Fleet Status</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/database')}
          className="mission-card p-4 mission-card-hover cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">TOTAL DB RECORDS</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {stats?.dbStats?.total_records || 350}
          </div>
          <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1 mt-1">
            <span>Database Monitor</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Admin Modules Quick Launch Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="mission-card p-5 mission-card-hover cursor-pointer"
        >
          <Users className="w-7 h-7 text-cyan-400 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">User & Role Management</h3>
          <p className="text-xs text-slate-400 mt-1">
            Create new operators, assign mine permissions, edit supervisor credentials and reset passwords.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/database')}
          className="mission-card p-5 mission-card-hover cursor-pointer"
        >
          <Database className="w-7 h-7 text-amber-400 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Database Health & Explorer</h3>
          <p className="text-xs text-slate-400 mt-1">
            Paginated explorer for all 12 normalized tables with full-text search, column filters, and CSV export.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="mission-card p-5 mission-card-hover cursor-pointer"
        >
          <ShieldAlert className="w-7 h-7 text-emerald-400 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Security Audit Logs</h3>
          <p className="text-xs text-slate-400 mt-1">
            Review security audit trails for logins, alert acknowledgments, rover commands, and parameter modifications.
          </p>
        </div>
      </div>
    </div>
  );
};
