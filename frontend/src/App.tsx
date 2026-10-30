import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import { MissionControlLayout } from './components/layout/MissionControlLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { SensorsPage } from './pages/SensorsPage';
import { AlertsPage } from './pages/AlertsPage';
import { PatrolsPage } from './pages/PatrolsPage';
import { PatrolDetailPage } from './pages/PatrolDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CameraPage } from './pages/CameraPage';
import { MLInsightsPage } from './pages/MLInsightsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { UsersPage } from './pages/admin/UsersPage';
import { MinesPage } from './pages/admin/MinesPage';
import { RoversPage } from './pages/admin/RoversPage';
import { DatabaseMonitorPage } from './pages/admin/DatabaseMonitorPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

const queryClient = new QueryClient();

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-cyan-400 font-mono text-xs">
        <span className="animate-pulse">INITIALIZING MISSION CONTROL TELEMETRY...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Operations Mission Control */}
              <Route
                element={
                  <ProtectedRoute>
                    <MissionControlLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/live-map" element={<LiveMapPage />} />
                <Route path="/sensors" element={<SensorsPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/patrols" element={<PatrolsPage />} />
                <Route path="/patrols/:id" element={<PatrolDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/camera" element={<CameraPage />} />
                <Route path="/ml-insights" element={<MLInsightsPage />} />
                <Route path="/system-status" element={<SystemStatusPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Admin Suite */}
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/mines" element={<MinesPage />} />
                <Route path="/admin/rovers" element={<RoversPage />} />
                <Route path="/admin/database" element={<DatabaseMonitorPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
