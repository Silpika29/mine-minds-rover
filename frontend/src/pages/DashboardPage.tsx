import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../services/api';
import { MineStatusOverview } from '../components/dashboard/MineStatusOverview';
import { SensorCard } from '../components/dashboard/SensorCard';
import { LiveSensorChart } from '../components/dashboard/LiveSensorChart';
import { DigitalMineMap } from '../components/map/DigitalMineMap';
import { RecentAlertsPanel } from '../components/dashboard/RecentAlertsPanel';
import { AIInsightSummary } from '../components/dashboard/AIInsightSummary';
import { WifiStatusPanel } from '../components/dashboard/WifiStatusPanel';
import { SensorsOverview } from '../types';

export const DashboardPage: React.FC = () => {
  const { liveData } = useSocket();
  const [sensorsData, setSensorsData] = useState<SensorsOverview | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await apiClient.get('/sensors/latest');
        setSensorsData(res.data);
      } catch (e) {
        console.error('Error fetching latest sensors', e);
      }
    };
    fetchLatest();
  }, []);

  const lastPingTime = liveData?.last_ping_at ?? sensorsData?.last_ping;
  const isOffline = !lastPingTime || (new Date().getTime() - new Date(lastPingTime).getTime() > 15000);

  const methane = isOffline ? '-' : (liveData?.readings?.methane ?? sensorsData?.methane?.current ?? 0);
  const co = isOffline ? '-' : (liveData?.readings?.co ?? sensorsData?.co?.current ?? 0);
  const temp = isOffline ? '-' : (liveData?.readings?.temperature ?? sensorsData?.temperature?.current ?? 0);
  const hum = isOffline ? '-' : (liveData?.readings?.humidity ?? sensorsData?.humidity?.current ?? 0);
  const vib = isOffline ? '-' : (liveData?.readings?.vibration ?? sensorsData?.vibration?.current ?? 0);
  const batt = isOffline ? null : (liveData?.readings?.battery ?? sensorsData?.battery?.current ?? 0);

  const currentHazardStatus = isOffline ? 'OFFLINE' : (liveData?.hazard_status || sensorsData?.overall_status || 'NORMAL');
  const riskScore = isOffline ? 0 : (liveData?.risk_score ?? sensorsData?.risk_score ?? 0);
  const roverStatus = isOffline ? 'OFFLINE' : (liveData?.status || 'IDLE');

  return (
    <div className="space-y-6">
      {/* 1. Top Mine Status KPIs Banner */}
      <MineStatusOverview
        status={currentHazardStatus}
        roverCode={liveData?.rover_code || 'ROVER-01'}
        zoneCode={isOffline ? 'N/A' : (liveData?.zone_code || 'ZONE-03')}
        zoneName={isOffline ? 'Rover Offline' : (liveData?.zone_name || 'Tunnel B Longwall Heading')}
        battery={batt}
        patrolStatus={roverStatus}
        riskScore={riskScore}
      />

      {/* 2. Wi-Fi Connection Status */}
      <WifiStatusPanel />

      {/* 3. Middle Section: Large Live Digital Mine Map + Sensor Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DigitalMineMap interactive={true} />
        </div>

        <div className="space-y-4">
          {(() => {
            const numMethane = typeof methane === 'number' ? methane : 0;
            const numCo = typeof co === 'number' ? co : 0;
            const numTemp = typeof temp === 'number' ? temp : 0;
            const numVib = typeof vib === 'number' ? vib : 0;
            return (
              <>
                <SensorCard name="Methane Gas (CH4)" code="CH4" value={methane} unit="ppm"
                  status={isOffline ? 'OFFLINE' : (numMethane >= 1000 ? 'CRITICAL' : numMethane >= 500 ? 'ANOMALOUS' : 'NORMAL')}
                  trend={isOffline ? 'STABLE' : (numMethane > 500 ? 'RISING' : 'STABLE')}
                  rateOfChange={isOffline ? 0 : 0.8}
                  sparkline={isOffline ? [] : [420, 425, 430, numMethane - 10, numMethane]}
                  iconType="ch4" maxSafe={500} />

                <SensorCard name="Carbon Monoxide" code="CO" value={co} unit="ppm"
                  status={isOffline ? 'OFFLINE' : (numCo >= 150 ? 'CRITICAL' : numCo >= 50 ? 'ANOMALOUS' : 'NORMAL')}
                  trend={isOffline ? 'STABLE' : (numCo > 50 ? 'RISING' : 'STABLE')}
                  rateOfChange={isOffline ? 0 : 0.2}
                  sparkline={isOffline ? [] : [30, 32, 33, numCo - 2, numCo]}
                  iconType="co" maxSafe={50} />

                <SensorCard name="Ambient Temperature" code="TEMP" value={temp} unit="°C"
                  status={isOffline ? 'OFFLINE' : (numTemp >= 45 ? 'CRITICAL' : numTemp >= 35 ? 'ANOMALOUS' : 'NORMAL')}
                  trend="STABLE"
                  sparkline={isOffline ? [] : [26.8, 27.0, 27.2, numTemp - 0.2, numTemp]}
                  iconType="temp" maxSafe={35} />

                <SensorCard name="Structural Vibration" code="VIB" value={vib} unit="g"
                  status={isOffline ? 'OFFLINE' : (numVib >= 1.0 ? 'CRITICAL' : numVib >= 0.5 ? 'ANOMALOUS' : 'NORMAL')}
                  trend={isOffline ? 'STABLE' : (numVib > 0.5 ? 'RISING' : 'STABLE')}
                  sparkline={isOffline ? [] : [0.18, 0.20, 0.21, numVib - 0.05, numVib]}
                  iconType="vib" maxSafe={0.5} />
              </>
            );
          })()}
        </div>
      </div>

      {/* 4. Bottom Section: Real-Time Graphs & Diagnostic Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveSensorChart roverCode="ROVER-01" />
        </div>
        <div>
          <AIInsightSummary />
        </div>
      </div>

      {/* 5. Active Safety Alerts Feed */}
      <div>
        <RecentAlertsPanel />
      </div>
    </div>
  );
};
