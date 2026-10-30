import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sliders, Volume2, Radio, Server, CheckCircle2, ShieldCheck, AlertCircle, Loader2, Shield } from 'lucide-react';
import { apiClient } from '../services/api';
import { AudioToggle } from '../components/common/AudioToggle';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [ch4Warn, setCh4Warn] = useState<number>(500);
  const [ch4Crit, setCh4Crit] = useState<number>(1000);
  const [coWarn, setCoWarn] = useState<number>(50);
  const [coCrit, setCoCrit] = useState<number>(150);
  const [loraFrequency, setLoraFrequency] = useState<string>('868.1 MHz (EU/AS Band)');
  const [baudRate, setBaudRate] = useState<string>('115200');

  // Load settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        const settings = res.data as Array<{ key: string; value: any }>;
        for (const s of settings) {
          switch (s.key) {
            case 'ch4_warning_threshold': setCh4Warn(Number(s.value)); break;
            case 'ch4_critical_threshold': setCh4Crit(Number(s.value)); break;
            case 'co_warning_threshold': setCoWarn(Number(s.value)); break;
            case 'co_critical_threshold': setCoCrit(Number(s.value)); break;
            case 'lora_frequency': setLoraFrequency(String(s.value)); break;
            case 'uart_baud_rate': setBaudRate(String(s.value)); break;
          }
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    // Validation
    if (ch4Warn <= 0 || ch4Crit <= 0 || coWarn <= 0 || coCrit <= 0) {
      setError('Threshold values must be positive numbers.');
      return;
    }
    if (ch4Warn >= ch4Crit) {
      setError('CH4 warning threshold must be strictly less than critical limit.');
      return;
    }
    if (coWarn >= coCrit) {
      setError('CO warning threshold must be strictly less than critical limit.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/settings', {
        settings: {
          ch4_warning_threshold: ch4Warn,
          ch4_critical_threshold: ch4Crit,
          co_warning_threshold: coWarn,
          co_critical_threshold: coCrit,
          lora_frequency: loraFrequency,
          uart_baud_rate: baudRate,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to save parameters to database. Admin privileges required.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading system parameters from backend database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span>System Parameters &amp; Hardware Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global safety thresholds, ESP32/LoRa adapter settings, and alert preferences.
            Changes are saved to the <code className="text-cyan-400">system_settings</code> database table and audited in <code className="text-cyan-400">audit_logs</code>.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/audit-logs')}
          className="px-3.5 py-2 rounded-xl bg-[#141F36] hover:bg-[#1E2E4E] text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold flex items-center space-x-2 transition-all"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>View Audit Trail</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System configuration updated and saved to database successfully. Change recorded in Audit Trail.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/60 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Layer 1 Safety Thresholds Card */}
        <div className="mission-card p-5 bg-[#0B132B] border border-[#1E2E4E] space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1E2E4E] pb-3">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Layer 1 Deterministic Threshold Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-mono uppercase font-bold text-slate-300 block mb-1">
                Methane (CH4) Warning Threshold (ppm)
              </label>
              <input
                type="number"
                value={ch4Warn}
                onChange={(e) => setCh4Warn(Number(e.target.value))}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="font-mono uppercase font-bold text-red-300 block mb-1">
                Methane (CH4) Critical Evacuation Limit (ppm)
              </label>
              <input
                type="number"
                value={ch4Crit}
                onChange={(e) => setCh4Crit(Number(e.target.value))}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="font-mono uppercase font-bold text-slate-300 block mb-1">
                Carbon Monoxide (CO) Warning Threshold (ppm)
              </label>
              <input
                type="number"
                value={coWarn}
                onChange={(e) => setCoWarn(Number(e.target.value))}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="font-mono uppercase font-bold text-red-300 block mb-1">
                Carbon Monoxide (CO) Lethal Critical Limit (ppm)
              </label>
              <input
                type="number"
                value={coCrit}
                onChange={(e) => setCoCrit(Number(e.target.value))}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* LoRa & Hardware Gateway Adapter */}
        <div className="mission-card p-5 bg-[#0B132B] border border-[#1E2E4E] space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1E2E4E] pb-3">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Hardware LoRa Gateway Adapter Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-mono uppercase font-bold text-slate-300 block mb-1">
                LoRa Channel Carrier Frequency
              </label>
              <select
                value={loraFrequency}
                onChange={(e) => setLoraFrequency(e.target.value)}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option>868.1 MHz (EU/AS Band)</option>
                <option>915.0 MHz (US Band)</option>
                <option>433.0 MHz (Sub-GHz Long Range)</option>
              </select>
            </div>

            <div>
              <label className="font-mono uppercase font-bold text-slate-300 block mb-1">
                Serial / UART Baud Rate
              </label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option>115200</option>
                <option>57600</option>
                <option>9600</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio Alerts Preferences */}
        <div className="mission-card p-5 bg-[#0B132B] border border-[#1E2E4E] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Audio Siren &amp; Emergency Alerts</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Toggle audible synthesized siren alarms during Critical Emergency triggers.
            </p>
          </div>
          <AudioToggle />
        </div>

        {/* Storage Info */}
        <div className="p-3 rounded-xl bg-[#080D1A] border border-[#1E2E4E] text-xs text-slate-400 flex items-start space-x-2">
          <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Data Storage:</strong> Parameters are persisted in the <code className="text-cyan-400">system_settings</code> database table via <code className="text-cyan-400">PUT /api/v1/settings</code>. All changes are recorded in the <code className="text-cyan-400">audit_logs</code> table.
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center space-x-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save Parameter Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
