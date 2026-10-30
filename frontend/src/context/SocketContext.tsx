import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { SafetyStatusType } from '../types';

export interface LiveTelemetry {
  rover_code: string;
  zone_code: string;
  zone_name: string;
  zone_id: number;
  battery: number;
  status: string;
  hazard_status: SafetyStatusType;
  risk_score: number;
  last_ping_at?: string;
  wifi_ssid?: string;
  wifi_ip?: string;
  is_hardware_connected?: boolean;
  is_simulated?: boolean;
  source?: string;
  readings: {
    methane: number;
    co: number;
    temperature: number;
    humidity: number;
    water: boolean;
    vibration: number;
    battery: number;
  };
  ml_prediction?: {
    prediction: SafetyStatusType;
    confidence: number;
    explanations: any[];
    probabilities: Record<string, number>;
  };
  rule_status: string;
  is_emergency: boolean;
  timestamp: string;
}

interface SocketContextType {
  isConnected: boolean;
  liveData: LiveTelemetry | null;
  lastAlert: any | null;
  telemetryHistory: LiveTelemetry[];
  activeEmergency: boolean;
  dismissEmergency: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveTelemetry | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<LiveTelemetry[]>([]);
  const [lastAlert, setLastAlert] = useState<any | null>(null);
  const [activeEmergency, setActiveEmergency] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const wsUrl = import.meta.env.VITE_WS_URL || (isLocal ? `ws://localhost:8000/ws/live` : `${protocol}//${window.location.host}/ws/live`);

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[WS] Connected to live telemetry stream');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { event: eventType, data } = message;

            if (eventType === 'sensor_update') {
              setLiveData(data);
              setTelemetryHistory((prev) => {
                const next = [...prev, data];
                return next.length > 50 ? next.slice(next.length - 50) : next;
              });

              if (data.is_emergency) {
                setActiveEmergency(true);
              }
            } else if (eventType === 'alert_created') {
              setLastAlert(data);
              if (data.severity === 'CRITICAL') {
                setActiveEmergency(true);
              }
            } else if (eventType === 'emergency_mode') {
              if (data.active) {
                setActiveEmergency(true);
              }
            }
          } catch (err) {
            console.error('[WS Parse Error]', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('[WS] Disconnected. Reconnecting in 3s...');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WS Error]', err);
          ws.close();
        };
      } catch (e) {
        console.error('[WS Init Error]', e);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const dismissEmergency = () => {
    setActiveEmergency(false);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        liveData,
        lastAlert,
        telemetryHistory,
        activeEmergency,
        dismissEmergency,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
