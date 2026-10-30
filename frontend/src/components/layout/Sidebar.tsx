import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  Activity,
  AlertTriangle,
  Route,
  BarChart3,
  BrainCircuit,
  FileText,
  Video,
  Users,
  Building2,
  Cpu,
  Database,
  Shield,
  HeartPulse,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole(['admin']);

  const mainNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/live-map', label: 'Live Mine Map', icon: <Map className="w-5 h-5" /> },
    { to: '/sensors', label: 'Live Sensors', icon: <Activity className="w-5 h-5" /> },
    { to: '/alerts', label: 'Safety Alerts', icon: <AlertTriangle className="w-5 h-5" /> },
    { to: '/patrols', label: 'Patrol Records', icon: <Route className="w-5 h-5" /> },
    { to: '/analytics', label: 'Hazard Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/ml-insights', label: 'Explainable AI', icon: <BrainCircuit className="w-5 h-5" /> },
    { to: '/reports', label: 'Patrol Reports', icon: <FileText className="w-5 h-5" /> },
    { to: '/camera', label: 'Live Camera HUD', icon: <Video className="w-5 h-5" /> },
  ];

  const adminNavItems = [
    { to: '/admin/users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { to: '/admin/mines', label: 'Mines & Sectors', icon: <Building2 className="w-5 h-5" /> },
    { to: '/admin/rovers', label: 'Rover Fleet', icon: <Cpu className="w-5 h-5" /> },
    { to: '/admin/database', label: 'Database Monitor', icon: <Database className="w-5 h-5" /> },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: <Shield className="w-5 h-5" /> },
    { to: '/system-status', label: 'System Health', icon: <HeartPulse className="w-5 h-5" /> },
    { to: '/settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`bg-[#090F20] border-r border-[#1E2E4E] transition-all duration-300 flex flex-col justify-between shrink-0 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main Operations Section */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">
              Operations Center
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141F36]'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Administration Section (Admin only or elevated) */}
        {isAdmin && (
          <div className="pt-2 border-t border-[#1E2E4E]/60">
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold font-mono tracking-wider uppercase text-cyan-400">
                Administration & Fleet
              </div>
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#141F36]'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <div className="shrink-0">{item.icon}</div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-[#1E2E4E] flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-[#141F36] hover:bg-[#1C2C4E] text-slate-400 hover:text-white transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="ml-2 text-xs font-medium">Collapse Menu</span>}
        </button>
      </div>
    </aside>
  );
};
