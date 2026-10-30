import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { EmergencyBanner } from './EmergencyBanner';
import { ScenarioControlBar } from '../common/ScenarioControlBar';
import { useSocket } from '../../context/SocketContext';

export const MissionControlLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { activeEmergency, liveData } = useSocket();

  return (
    <div className={`min-h-screen flex flex-col bg-[#070B14] text-slate-100 ${activeEmergency ? 'emergency-active-border' : ''}`}>
      {/* Top Application Bar */}
      <TopBar />

      {/* Demo Scenario Control Bar (Always accessible for live presentation testing) */}
      <ScenarioControlBar currentMode={liveData?.is_emergency ? 'CRITICAL_EMERGENCY' : undefined} />

      {/* Emergency Mode Banner (Appears on Critical Trigger) */}
      <EmergencyBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Operational Screen Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-radial-gradient">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
