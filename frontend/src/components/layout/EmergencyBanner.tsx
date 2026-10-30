import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioService } from '../../services/audioService';
import { AlertOctagon, Video, MapPin, CheckCircle2, Siren, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmergencyBanner: React.FC = () => {
  const { activeEmergency, dismissEmergency, liveData, lastAlert } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeEmergency) {
      audioService.playEmergencySiren();
    } else {
      audioService.stopEmergencySiren();
    }
  }, [activeEmergency]);

  if (!activeEmergency) return null;

  const roverCode = liveData?.rover_code || 'ROVER-01';
  const zoneName = liveData?.zone_name || 'Tunnel B - Zone 03';
  const riskScore = liveData?.risk_score ?? 94;

  const handleAcknowledge = () => {
    audioService.stopEmergencySiren();
    dismissEmergency();
  };

  return (
    <div className="bg-red-950/90 border-y-2 border-red-600 px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-40 sticky top-16 backdrop-blur-md animate-pulse-slow">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Warning Icon & Incident Meta */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 hazard-pulse-red shrink-0">
            <Siren className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded tracking-wider uppercase animate-pulse">
                CRITICAL HAZARD DETECTED
              </span>
              <span className="text-red-300 font-mono text-xs font-semibold">
                Risk Score: {riskScore.toFixed(0)}/100
              </span>
            </div>
            <p className="text-white font-bold text-sm mt-0.5">
              Sector Alert: <span className="text-red-200 underline">{zoneName}</span> &bull; Assigned Unit: {roverCode}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/camera')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-red-500/60 text-red-200 hover:bg-red-900/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            <span>View Camera HUD</span>
          </button>

          <button
            onClick={() => navigate('/live-map')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-red-500/60 text-red-200 hover:bg-red-900/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Track on Map</span>
          </button>

          <button
            onClick={handleAcknowledge}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center space-x-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Acknowledge Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
