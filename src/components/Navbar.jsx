import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, 
  MapPin, 
  Layers, 
  Users,
  Radio, 
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { downloadHistoricalDataCsv } from '../services/api';

export default function Navbar({ 
  locationData, 
  locationsList = [],
  selectedLocationId = 'LOC_001',
  onSelectLocation,
  isLive, 
  isRefreshing, 
  onRefresh, 
  onResetView, 
  activeTab, 
  setActiveTab 
}) {
  const locId = locationData?.id || selectedLocationId;
  const locName = locationData?.name || (locId === 'LOC_001' ? 'Idea Factory' : 'Test Location');

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [downloadingRange, setDownloadingRange] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  
  const downloadRef = useRef(null);
  const locationRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (rangeKey, rangeLabel) => {
    try {
      setDownloadingRange(rangeKey);
      setDownloadStatus(null);
      await downloadHistoricalDataCsv(locId, rangeKey);
      setDownloadStatus({ type: 'success', message: `${rangeLabel} CSV downloaded` });
      setTimeout(() => {
        setDownloadStatus(null);
        setShowDownloadMenu(false);
      }, 1500);
    } catch (err) {
      console.error('[Navbar] Download error:', err);
      setDownloadStatus({ type: 'error', message: 'Download failed. Ensure backend is running.' });
    } finally {
      setDownloadingRange(null);
    }
  };

  const downloadOptions = [
    { key: '1week', label: '1 Week', desc: 'Past 7 days of sensor readings' },
    { key: '1month', label: '1 Month', desc: 'Past 30 days of sensor readings' },
    { key: '1year', label: '1 Year', desc: 'Past 365 days of sensor readings' },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 z-30 shrink-0 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & System Title */}
        <div 
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Go to Map Overview"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                TerraPulse
              </h1>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Soil Health OS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span>FastAPI Backend Live</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Agricultural GIS Node</span>
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs & Active Location Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          
          {/* Navigation Item: Satellite Map */}
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === 'map' ? 'text-emerald-200' : 'text-slate-400'}`} />
            <span>Satellite Map</span>
          </button>

          {/* Navigation Item: Team & Project */}
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'team' ? 'text-emerald-200' : 'text-slate-400'}`} />
            <span>Team & Project</span>
          </button>

          <div className="hidden lg:block h-4 w-px bg-slate-800 mx-1"></div>

          {/* Interactive Multi-Location Selector */}
          <div className="relative block" ref={locationRef}>
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-medium transition-colors"
              title="Select Active Field Location"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow"></span>
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">{locId}</span>
              <span className="text-slate-300 font-semibold truncate max-w-[120px]">({locName})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Location Selector Dropdown */}
            {showLocationMenu && (
              <div className="absolute left-0 top-10 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                  Select Field Location
                </div>
                {locationsList.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onSelectLocation?.(l.id);
                      setShowLocationMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      l.id === locId 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold">{l.id}</div>
                      <div className="text-[11px] text-slate-400">{l.name}</div>
                    </div>
                    {l.id === locId && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Download Data, Sync, Reset View */}
        <div className="flex items-center gap-2.5">
          
          {/* Download Data Dropdown Control */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm"
              title="Download historical telemetry as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showDownloadMenu && (
              <div className="absolute right-0 top-10 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Export Telemetry (CSV)</span>
                  <span className="font-mono text-emerald-400 text-[10px]">{locId}</span>
                </div>

                {downloadOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleDownload(opt.key, opt.label)}
                    disabled={downloadingRange !== null}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-slate-400">{opt.desc}</div>
                      </div>
                    </div>

                    {downloadingRange === opt.key ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300" />
                    )}
                  </button>
                ))}

                {downloadStatus && (
                  <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 mt-1 ${
                    downloadStatus.type === 'success' 
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-red-950/80 text-red-300 border border-red-500/40'
                  }`}>
                    {downloadStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="truncate">{downloadStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Action */}
          <button 
            onClick={onRefresh}
            title="Fetch fresh telemetry from FastAPI backend"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Reset / Focus Button */}
          {activeTab === 'map' ? (
            <button 
              onClick={onResetView}
              title={`Center Map on ${locId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate {locId}</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('map')}
              title="Go to Map View"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View Map</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
