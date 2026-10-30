import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../../services/audioService';

export const AudioToggle: React.FC = () => {
  const [muted, setMuted] = useState<boolean>(audioService.getMuted());

  const handleToggle = () => {
    const nextState = audioService.toggleMute();
    setMuted(nextState);
    if (!nextState) {
      audioService.playBeep(880, 0.1);
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={muted ? "Unmute Audio Sirens & Alerts" : "Mute Audio Sirens"}
      className={`p-2 rounded-lg border transition-all duration-200 ${
        muted
          ? "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
          : "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20"
      }`}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
    </button>
  );
};
