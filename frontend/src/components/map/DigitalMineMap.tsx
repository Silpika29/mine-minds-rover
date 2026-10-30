import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { 
  Compass, 
  MapPin, 
  AlertTriangle, 
  Upload, 
  History, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Radio, 
  ShieldAlert, 
  X, 
  Check, 
  FileUp, 
  Loader2,
  Eye
} from 'lucide-react';
import { ZoneDetailsModal } from './ZoneDetailsModal';

interface DigitalMineMapProps {
  interactive?: boolean;
  selectedZoneCode?: string;
  onSelectZone?: (zoneCode: string) => void;
}

interface MapVersionItem {
  id: number;
  name: string;
  version: number;
  file_path: string;
  description?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  is_active: boolean;
}

export const DigitalMineMap: React.FC<DigitalMineMapProps> = ({
  interactive = true,
  selectedZoneCode: externalSelected,
  onSelectZone
}) => {
  const { liveData } = useSocket();
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole(['admin']);

  const [mode, setMode] = useState<'SIMULATION' | 'LIVE'>('SIMULATION');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);

  // Map Upload & Version modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showVersionsModal, setShowVersionsModal] = useState<boolean>(false);
  const [mapVersions, setMapVersions] = useState<MapVersionItem[]>([]);
  const [activeMap, setActiveMap] = useState<MapVersionItem | null>(null);

  // Upload Form state
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadDesc, setUploadDesc] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const lastPingTime = liveData?.last_ping_at;
  const isOffline = !lastPingTime || (new Date().getTime() - new Date(lastPingTime).getTime() > 15000);
  const currentRoverZone = isOffline ? 'ENTRY' : (liveData?.zone_code || 'ENTRY');
  const roverStatus = isOffline ? 'OFFLINE' : (liveData?.status || 'IDLE');

  // Load Active Map & Version History from backend
  const fetchMaps = async () => {
    try {
      const [versionsRes, activeRes] = await Promise.all([
        apiClient.get('/maps'),
        apiClient.get('/maps/active'),
      ]);
      setMapVersions(versionsRes.data);
      setActiveMap(activeRes.data);
    } catch (e) {
      console.error('Failed to load mine maps', e);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
      setUploadFile(file);
      setUploadError('');
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);
    }
  };

  const handleMapUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG).');
      return;
    }
    if (!uploadName.trim()) {
      setUploadError('Please provide a map layout name.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', uploadName);
      formData.append('description', uploadDesc);
      formData.append('file', uploadFile);

      await apiClient.post('/maps/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess('Mine map layout uploaded successfully!');
      setUploadName('');
      setUploadDesc('');
      setUploadFile(null);
      setFilePreviewUrl('');
      await fetchMaps();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess('');
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to upload map. Verify file format and admin rights.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleActivateMap = async (mapId: number) => {
    try {
      await apiClient.put(`/maps/${mapId}/activate`);
      await fetchMaps();
    } catch (e) {
      console.error('Failed to set active map', e);
    }
  };

  // Mine Zones
  const zones = [
    { code: 'ENTRY', name: 'Shaft Base Portal', x: 80, y: 160, length: '80m', status: 'NORMAL', risk: 4, desc: 'Fresh air intake & shaft elevator' },
    { code: 'ZONE-01', name: 'Main Haulage Adit', x: 230, y: 160, length: '120m', status: 'NORMAL', risk: 6, desc: 'Primary rail transport gallery' },
    { code: 'ZONE-02', name: 'Conveyor Transfer', x: 380, y: 160, length: '110m', status: 'NORMAL', risk: 8, desc: 'Ore transfer & electrical sub-station' },
    { code: 'ZONE-03', name: 'Tunnel B Longwall', x: 530, y: 260, length: '150m', status: currentRoverZone === 'ZONE-03' && liveData ? liveData.hazard_status : 'ANOMALOUS', risk: currentRoverZone === 'ZONE-03' && liveData ? liveData.risk_score : 58, desc: 'Active extraction face & gas monitor sector' },
    { code: 'ZONE-04', name: 'Deep Heading Face', x: 680, y: 260, length: '140m', status: currentRoverZone === 'ZONE-04' && liveData ? liveData.hazard_status : 'NORMAL', risk: currentRoverZone === 'ZONE-04' && liveData ? liveData.risk_score : 18, desc: 'Advancing face development heading' },
  ];

  const handleZoneClick = (z: any) => {
    if (!interactive) return;
    setSelectedZone(z);
    if (onSelectZone) onSelectZone(z.code);
  };

  const activeZoneObj = zones.find((z) => z.code === currentRoverZone) || zones[0];

  return (
    <div className="mission-card p-4 relative overflow-hidden bg-[#0A1124] border border-[#1E2E4E] space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2E4E] pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-100">
            Live Mine Map &amp; Spatial Localization
          </h3>
          {activeMap && (
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
              {activeMap.name} (v{activeMap.version})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="bg-[#070D1C] p-1 rounded-lg border border-[#1E2E4E] flex items-center space-x-1 text-xs font-mono">
            <button
              onClick={() => setMode('SIMULATION')}
              className={`px-2.5 py-1 rounded-md transition-all font-bold ${
                mode === 'SIMULATION'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SIMULATION MODE
            </button>
            <button
              onClick={() => setMode('LIVE')}
              className={`px-2.5 py-1 rounded-md transition-all font-bold ${
                mode === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LIVE / ACTUAL MODE
            </button>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center space-x-1 transition-colors"
                title="Upload / Update Mine Map Layout"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Map</span>
              </button>

              <button
                onClick={() => setShowVersionsModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-[#141F36] hover:bg-slate-700 text-slate-300 border border-[#1E2E4E] text-xs font-mono font-semibold flex items-center space-x-1 transition-colors"
                title="Map Version History"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Map Versions</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Status Banners */}
      {mode === 'SIMULATION' ? (
        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold">SIMULATION MODE &mdash; All displayed map telemetry, rover movement, and hazard data are simulated.</span>
          </div>
          <span className="text-[10px] text-amber-400/80 uppercase font-semibold">SIH Demo Sandbox</span>
        </div>
      ) : (
        <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
          isOffline 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center space-x-2">
            <Radio className={`w-4 h-4 shrink-0 ${isOffline ? 'text-rose-400' : 'text-emerald-400 animate-pulse'}`} />
            <span className="font-bold">
              {isOffline 
                ? 'Rover Offline &mdash; No Live Telemetry Received (Waiting for Rover Connection)' 
                : 'ACTUAL MINE MODE &mdash; Live ESP32 Hardware Telemetry Active'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold">
            {isOffline ? 'DISCONNECTED' : 'HARDWARE LINK ONLINE'}
          </span>
        </div>
      )}

      {/* Map Viewport Canvas */}
      <div className="w-full h-80 bg-[#060A14] rounded-lg border border-[#1A2640] relative overflow-hidden radar-grid flex items-center justify-center select-none">
        
        {/* Zoom & Map Control Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
            className="p-1.5 rounded-lg bg-[#0B132B]/90 hover:bg-slate-700 border border-[#1E2E4E] text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            className="p-1.5 rounded-lg bg-[#0B132B]/90 hover:bg-slate-700 border border-[#1E2E4E] text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg bg-[#0B132B]/90 hover:bg-slate-700 border border-[#1E2E4E] text-slate-300 hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* SVG Map Graphics with Zoom Transform */}
        <div 
          className="w-full h-full transition-transform duration-300 flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg viewBox="0 0 800 380" className="w-full h-full">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* If uploaded active image map exists in LIVE mode */}
            {mode === 'LIVE' && activeMap?.file_path ? (
              <image
                href={`http://localhost:8000${activeMap.file_path}`}
                x="50"
                y="30"
                width="700"
                height="320"
                preserveAspectRatio="xMidYMid slice"
                opacity="0.85"
              />
            ) : (
              <>
                {/* Standard Tunnel Vector Geometry */}
                <path d="M 80 160 L 230 160 L 380 160" stroke="#2E3D5E" strokeWidth="18" strokeLinecap="round" fill="none" />
                <path d="M 80 160 L 230 160 L 380 160" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.4" />

                <path d="M 380 160 C 450 160, 460 260, 530 260" stroke="#2E3D5E" strokeWidth="18" strokeLinecap="round" fill="none" />
                <path d="M 380 160 C 450 160, 460 260, 530 260" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.4" />

                <path d="M 530 260 L 680 260" stroke="#2E3D5E" strokeWidth="18" strokeLinecap="round" fill="none" />
                <path d="M 530 260 L 680 260" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.4" />
              </>
            )}

            {/* Mine Zone Checkpoint Nodes */}
            {zones.map((z, idx) => {
              const isRoverHere = (mode === 'SIMULATION' || !isOffline) && z.code === currentRoverZone;
              const isCrit = mode === 'SIMULATION' ? z.status === 'CRITICAL' : (!isOffline && z.status === 'CRITICAL');
              const isAnom = mode === 'SIMULATION' ? z.status === 'ANOMALOUS' : (!isOffline && z.status === 'ANOMALOUS');

              let nodeColor = '#10B981'; // Green
              if (isCrit) nodeColor = '#EF4444';
              else if (isAnom) nodeColor = '#F59E0B';

              return (
                <g
                  key={z.code}
                  onClick={() => handleZoneClick(z)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={z.x}
                    cy={z.y}
                    r="24"
                    fill={nodeColor}
                    fillOpacity="0.15"
                    stroke={nodeColor}
                    strokeWidth={isRoverHere ? "2.5" : "1.5"}
                    className="group-hover:fill-opacity-30 transition-all"
                    filter={isCrit ? "url(#glow)" : undefined}
                  />

                  <circle cx={z.x} cy={z.y} r="12" fill="#0B132B" stroke={nodeColor} strokeWidth="2" />

                  <text x={z.x} y={z.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    0{idx + 1}
                  </text>

                  <text x={z.x} y={z.y - 32} textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600" className="select-none">
                    {z.code}
                  </text>
                  <text x={z.x} y={z.y - 20} textAnchor="middle" fill="#94A3B8" fontSize="9" className="select-none">
                    {z.name}
                  </text>

                  {mode === 'SIMULATION' && (
                    <>
                      <rect x={z.x - 22} y={z.y + 28} width="44" height="16" rx="4" fill="#0B132B" stroke={nodeColor} strokeWidth="1" />
                      <text x={z.x} y={z.y + 40} textAnchor="middle" fill={nodeColor} fontSize="9" fontFamily="monospace" fontWeight="bold">
                        {z.risk.toFixed(0)}/100
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Rover Marker Rendering Logic */}
            {(mode === 'SIMULATION' || !isOffline) && (
              <motion.g
                animate={{ x: activeZoneObj.x, y: activeZoneObj.y }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <circle r="28" fill="none" stroke="#06B6D4" strokeWidth="2" opacity="0.6" className="animate-ping" />
                <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" filter="url(#glow)" />
                <circle r="4" fill="#0B132B" />

                <rect x="-35" y="-42" width="70" height="20" rx="4" fill="#0F172A" stroke="#06B6D4" strokeWidth="1.5" />
                <text x="0" y="-28" textAnchor="middle" fill="#06B6D4" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  ROVER-01
                </text>
              </motion.g>
            )}
          </svg>
        </div>

        {/* Legend Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-[#0B132B]/90 border border-[#1E2E4E] px-3 py-2 rounded-lg text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Anomalous</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Critical</span>
            </span>
            <span>&bull;</span>
            <span className="text-cyan-400 font-bold">
              {mode === 'SIMULATION' ? 'SIMULATION MODE' : (isOffline ? 'ROVER OFFLINE' : 'LIVE TELEMETRY')}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Zone Popover */}
      {selectedZone && (
        <ZoneDetailsModal zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}

      {/* Upload Mine Map Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="mission-card max-w-lg w-full p-6 bg-[#0B132B] border border-[#1E2E4E] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Upload / Update Mine Map Layout
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-950/40 border border-red-500/60 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleMapUpload} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase">Map Layout Name *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Silver Peak Colliery Level 4 Adit Map"
                  className="w-full bg-[#070D1C] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase">Change Description / Notes</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Describe recent sector modifications, shaft expansion, or ventilation changes..."
                  rows={2}
                  className="w-full bg-[#070D1C] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase">Select Mine Map File (PNG, JPG, SVG - Max 10MB) *</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleFileSelect}
                  className="w-full bg-[#070D1C] border border-[#1E2E4E] rounded-xl p-2.5 text-slate-300 focus:outline-none"
                  required
                />
              </div>

              {filePreviewUrl && (
                <div className="p-2 border border-[#1E2E4E] rounded-xl bg-[#060A14] text-center">
                  <div className="text-[10px] text-slate-400 mb-1">IMAGE PREVIEW BEFORE ACTIVATION</div>
                  <img src={filePreviewUrl} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center space-x-2 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Upload &amp; Save Map Version</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Version History Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="mission-card max-w-2xl w-full p-6 bg-[#0B132B] border border-[#1E2E4E] space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Mine Map Version History &amp; Activation
                </h3>
              </div>
              <button onClick={() => setShowVersionsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {mapVersions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No uploaded custom map versions found. Using default vector geometry.
                </div>
              ) : (
                mapVersions.map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      v.is_active
                        ? 'bg-cyan-950/30 border-cyan-500 text-slate-100'
                        : 'bg-[#070D1C] border-[#1E2E4E] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-cyan-300">{v.name}</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                          v{v.version}
                        </span>
                        {v.is_active && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            ACTIVE MAP
                          </span>
                        )}
                      </div>
                      {v.description && <p className="text-slate-400 mt-1">{v.description}</p>}
                      <div className="text-[10px] text-slate-500 mt-2">
                        Uploaded by @{v.uploaded_by || 'admin'} &bull; {v.uploaded_at ? new Date(v.uploaded_at).toLocaleString() : '-'}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {!v.is_active && isAdmin && (
                        <button
                          onClick={() => handleActivateMap(v.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
