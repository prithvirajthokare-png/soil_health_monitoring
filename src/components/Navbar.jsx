import React, { useState } from 'react';
import { 
  Sprout, 
  MapPin, 
  Layers, 
  Users,
  Activity, 
  Radio, 
  Cpu, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  RefreshCw,
  ShieldCheck,
  Zap,
  FolderGit2
} from 'lucide-react';
import { LOCATION_LOC_001 } from '../data/mockLocation';

export default function Navbar({ onResetView, activeLayer, setActiveLayer, activeTab, setActiveTab }) {
  const [selectedLocation, setSelectedLocation] = useState('LOC_001');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
  };

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
              <span>Local Telemetry Dashboard</span>
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

          {/* Location Selector Badge */}
          <div className="hidden lg:flex items-center">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700/60 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow"></span>
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">{LOCATION_LOC_001.code}</span>
              <span className="text-slate-400">({LOCATION_LOC_001.name})</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-medium">
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & System Status */}
        <div className="flex items-center gap-2.5">
          {/* Node Health Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Telemetry:</span>
            <span className="font-mono text-emerald-400 font-semibold">14/14 Nodes</span>
          </div>

          {/* Refresh Action */}
          <button 
            onClick={handleRefresh}
            title="Refresh local sensor cache"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Reset / Focus Button */}
          {activeTab === 'map' ? (
            <button 
              onClick={onResetView}
              title="Center Map on LOC_001"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate LOC_001</span>
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
