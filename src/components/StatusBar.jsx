import React from 'react';
import { Activity, Radio, Cpu, HardDrive, Wifi, MapPin, Users, Layers } from 'lucide-react';
import { LOCATION_LOC_001, SYSTEM_INFO } from '../data/mockLocation';

export default function StatusBar({ zoomLevel, cursorCoords, activeTab }) {
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
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {SYSTEM_INFO.version}
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
          <span className="font-bold">{LOCATION_LOC_001.code}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="text-slate-300">
          {cursorCoords && activeTab === 'map' ? (
            <span>Cursor: {cursorCoords.lat.toFixed(4)}°N, {Math.abs(cursorCoords.lng).toFixed(4)}°W</span>
          ) : (
            <span>Center: {LOCATION_LOC_001.coordinates.formatted}</span>
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
          <span className="text-slate-300">Local Bus (115200 baud)</span>
        </div>
        <span className="hidden md:inline text-slate-500 font-sans text-[11px]">
          Ready for Sensor Gateway
        </span>
      </div>

    </footer>
  );
}
