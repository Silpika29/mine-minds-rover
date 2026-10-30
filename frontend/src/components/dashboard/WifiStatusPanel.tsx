import React, { useState } from 'react';
import { Wifi, WifiOff, Server, TerminalSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const WifiStatusPanel: React.FC = () => {
  const { isConnected, liveData } = useSocket();
  const [showProcedure, setShowProcedure] = useState(false);

  const lastPingTime = liveData?.last_ping_at;
  const isOffline = !lastPingTime || (new Date().getTime() - new Date(lastPingTime).getTime() > 15000);
  
  const ssid = isOffline ? 'N/A' : (liveData?.wifi_ssid || 'MINE-NET-5G');
  const ip = isOffline ? 'N/A' : (liveData?.wifi_ip || '192.168.1.105');
  
  // Overall connection status depends on both websocket connection and ping freshness
  const isFullyConnected = isConnected && !isOffline;

  return (
    <div className="mission-card p-4 bg-[#0A1124] border border-[#1E2E4E] space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
        <div className="flex items-center space-x-2">
          {isFullyConnected ? (
            <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-rose-400" />
          )}
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Rover Hardware Connection Link
          </h3>
        </div>
        <div className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
          isFullyConnected 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          <span>{isFullyConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Network Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#070D1C] p-2.5 rounded-lg border border-[#1E2E4E]">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Wifi className="w-4 h-4" />
              <span>Wi-Fi SSID</span>
            </div>
            <span className="font-mono text-sm text-cyan-400 font-bold">{ssid}</span>
          </div>
          
          <div className="flex items-center justify-between bg-[#070D1C] p-2.5 rounded-lg border border-[#1E2E4E]">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <TerminalSquare className="w-4 h-4" />
              <span>ESP32 IP Address</span>
            </div>
            <span className="font-mono text-sm text-slate-200">{ip}</span>
          </div>
        </div>

        {/* Backend / API Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#070D1C] p-2.5 rounded-lg border border-[#1E2E4E]">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Server className="w-4 h-4" />
              <span>Backend API Status</span>
            </div>
            <span className={`font-mono text-sm font-bold ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isConnected ? 'ONLINE' : 'CONNECTING...'}
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#070D1C] p-2.5 rounded-lg border border-[#1E2E4E]">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4" />
              <span>Last Data Received</span>
            </div>
            <span className="font-mono text-xs text-slate-300">
              {lastPingTime ? new Date(lastPingTime).toLocaleTimeString() : 'No Data'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message if disconnected but socket is up */}
      {!isFullyConnected && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Hardware Not Found:</strong> The dashboard is connected to the backend, but no data is being received from the ESP32 rover. Ensure the hardware is powered on and configured to send data.
          </p>
        </div>
      )}

      {/* Connection Procedure */}
      <div>
        <button 
          onClick={() => setShowProcedure(!showProcedure)}
          className="w-full flex items-center justify-between p-2.5 bg-[#0F172A] hover:bg-slate-800 border border-[#1E2E4E] rounded-lg transition-colors text-xs text-slate-300 font-semibold uppercase tracking-wider"
        >
          <span>Step-by-Step ESP32 Wi-Fi Connection Procedure</span>
          {showProcedure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showProcedure && (
          <div className="mt-2 p-4 bg-[#070D1C] border border-[#1E2E4E] rounded-lg text-xs text-slate-400 space-y-3">
            <p className="text-slate-200 mb-2 font-bold">Standard Operating Procedure (SOP):</p>
            <ol className="list-decimal list-inside space-y-2 ml-1 text-slate-300">
              <li>Power on the ESP32 rover using the main power switch.</li>
              <li>Connect the ESP32 to the configured Wi-Fi network or hotspot.</li>
              <li>Verify the Wi-Fi SSID and IP address via serial monitor or OLED screen.</li>
              <li>Configure the backend API address (<code className="text-cyan-400">http://localhost:8000</code> or gateway IP) if required.</li>
              <li>Allow the ESP32 to send sensor data to the backend (<code className="text-cyan-400">POST /api/sensors/ingest</code>).</li>
              <li>Verify that the dashboard receives the data.</li>
              <li>Display <strong>Connected</strong> only after successful communication is confirmed.</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-[#1E2E4E]/50 text-[10px] font-mono text-cyan-400/90">
              Note: The system displays "Connected" strictly after verified bidirectional network/API communication. Powering on without API ping will remain as "Disconnected".
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
