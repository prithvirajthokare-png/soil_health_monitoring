import React from 'react';
import { Wifi, MapPin } from 'lucide-react';

export default function StatusBar({ locationData, zoomLevel, cursorCoords, activeTab, isLive }) {
  const locId = locationData?.id || 'LOC_001';
  const lat = locationData?.latitude ?? 13.0094631;
  const lng = locationData?.longitude ?? 74.7952437;
  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  return (
    <footer className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 text-slate-400 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-30 select-none shrink-0 font-mono">
      
      {/* Left: System state & active view */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 font-semibold font-sans">TerraPulse Local Node</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            {isLive ? 'FastAPI Connected' : 'Local Standalone'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 capitalize font-sans">{activeTab === 'map' ? 'GIS Satellite Mode' : 'Team Directory Mode'}</span>
        </div>
      </div>

      {/* Center: Live GPS / Directory status */}
      <div className="flex items-center gap-3 bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-slate-400">Pilot Site:</span>
          <span className="font-bold">{locId}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="text-slate-300">
          {cursorCoords && activeTab === 'map' ? (
            <span>Cursor: {cursorCoords.lat.toFixed(4)}°N, {Math.abs(cursorCoords.lng).toFixed(4)}°W</span>
          ) : (
            <span>Center: {formattedCoords}</span>
          )}
        </div>
        {activeTab === 'map' && (
          <>
            <span className="text-slate-700">|</span>
            <div className="text-slate-400">
              Zoom: <span className="text-slate-200 font-bold">{zoomLevel}x</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Telemetry & Gateway */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">SQLite Telemetry Stream</span>
        </div>
        <span className="hidden md:inline text-slate-500 font-sans text-[11px]">
          Port 8000 Ready
        </span>
      </div>

    </footer>
  );
}
