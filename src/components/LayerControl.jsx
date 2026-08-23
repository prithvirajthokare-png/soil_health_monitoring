import React from 'react';
import { Layers, Globe, Mountain, Flame, Eye } from 'lucide-react';

export default function LayerControl({ activeLayer, onChangeLayer, showOverlay, onToggleOverlay }) {
  const baseLayers = [
    { id: 'satellite', name: 'Satellite (Google / Esri)', icon: Globe, desc: 'High-res orbital imagery' },
    { id: 'hybrid', name: 'Hybrid Imagery', icon: Layers, desc: 'Satellite with road & border labels' },
    { id: 'topo', name: 'Topographic / Terrain', icon: Mountain, desc: 'Elevation & soil contour contours' }
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs space-y-2.5 w-64">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 px-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Map Basemap & Layers</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
          GIS Live
        </span>
      </div>

      <div className="space-y-1">
        {baseLayers.map(layer => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onChangeLayer(layer.id)}
              className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all ${
                isActive 
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 shadow-sm' 
                  : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
              }`}
            >
              <div className={`p-1.5 rounded-md mt-0.5 ${isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs leading-tight">{layer.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{layer.desc}</div>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 self-center"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Layer Toggles */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 px-1">Overlays & Analytics</div>
        <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-300">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Soil Moisture Zone Grids</span>
          </div>
          <input 
            type="checkbox"
            checked={showOverlay}
            onChange={(e) => onToggleOverlay(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/20 h-4 w-4 accent-emerald-500"
          />
        </label>
      </div>
    </div>
  );
}
