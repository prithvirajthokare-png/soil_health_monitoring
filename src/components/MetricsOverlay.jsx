import React, { useState } from 'react';
import { 
  Droplets, 
  Thermometer, 
  TestTube, 
  Sparkles, 
  Gauge, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Compass, 
  Activity, 
  Zap, 
  SlidersHorizontal,
  CheckCircle2,
  Info
} from 'lucide-react';
import { LOCATION_LOC_001 } from '../data/mockLocation';

export default function MetricsOverlay({ onFocusLocation }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const loc = LOCATION_LOC_001;

  return (
    <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'translate-x-[calc(100%-36px)]' : 'translate-x-0'}`}>
      <div className="relative flex">
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="self-center -ml-4 w-8 h-12 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-l-xl shadow-xl flex items-center justify-center backdrop-blur-md z-10 transition-colors"
          title={isCollapsed ? "Expand Metrics HUD" : "Collapse Metrics HUD"}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>

        {/* HUD Container */}
        <div className="w-80 md:w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl shadow-black/60 text-slate-100 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          
          {/* Header Card */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {loc.id}
                </span>
                <span className="text-xs text-slate-400">Monitoring Hub</span>
              </div>
              <h2 className="font-bold text-base text-slate-100 mt-1">{loc.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-400 font-medium">{loc.crop}</span>
                <span>•</span>
                <span>{loc.coverageArea}</span>
              </div>
            </div>

            {/* Health Score Dial */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-inner">
              <div className="text-2xl font-black font-mono text-emerald-400 leading-none">
                {loc.healthScore}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">Score</div>
            </div>
          </div>

          {/* Location Quick Info Bar */}
          <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">GPS Coordinates</div>
                <div className="font-mono text-xs text-slate-200">{loc.coordinates.formatted}</div>
              </div>
            </div>
            <button
              onClick={onFocusLocation}
              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all text-[11px] font-semibold flex items-center gap-1"
              title="Recenter map on marker"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Telemetry Indicators</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-normal normal-case">
                <CheckCircle2 className="w-3 h-3" /> Nominal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Soil Moisture */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Moisture (VWC)</span>
                  <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-blue-300">{loc.metrics.moisture.value}</span>
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" 
                    style={{ width: `${(loc.metrics.moisture.value / 50) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Target: 25-30%</span>
                  <span className="text-emerald-400 font-medium">Optimal</span>
                </div>
              </div>

              {/* pH Level */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Soil pH</span>
                  <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                    <TestTube className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-purple-300">{loc.metrics.ph.value}</span>
                  <span className="text-xs text-slate-400 font-mono">pH</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full" 
                    style={{ width: `${(loc.metrics.ph.value / 14) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Range: 6.5-7.2</span>
                  <span className="text-emerald-400 font-medium">Neutral</span>
                </div>
              </div>

              {/* Soil Temperature */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Core Temp</span>
                  <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                    <Thermometer className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-amber-300">{loc.metrics.temperature.value}</span>
                  <span className="text-xs text-slate-400 font-mono">°C</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                  <span>Depth: 15 cm</span>
                  <span className="text-emerald-400 font-medium">Optimal</span>
                </div>
              </div>

              {/* Salinity / EC */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">EC (Salinity)</span>
                  <div className="p-1 rounded-md bg-teal-500/20 text-teal-400">
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-teal-300">{loc.metrics.ec.value}</span>
                  <span className="text-xs text-slate-400 font-mono">dS/m</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                  <span>Low Salinity</span>
                  <span className="text-emerald-400 font-medium">Safe</span>
                </div>
              </div>

            </div>

            {/* NPK Macronutrients Breakdown */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">NPK Macronutrients (mg/kg)</span>
                <span className="text-[10px] text-slate-500 font-mono">Spectroscopy Est.</span>
              </div>

              <div className="space-y-1.5">
                {/* Nitrogen */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Nitrogen (N)</span>
                    <span className="font-mono font-bold text-emerald-400">{loc.metrics.npk.nitrogen.value} mg/kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                {/* Phosphorus */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Phosphorus (P)</span>
                    <span className="font-mono font-bold text-cyan-400">{loc.metrics.npk.phosphorus.value} mg/kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                {/* Potassium */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Potassium (K)</span>
                    <span className="font-mono font-bold text-amber-400">{loc.metrics.npk.potassium.value} mg/kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Sensor Node Distribution */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>Active Sensor Nodes (LOC_001)</span>
                <span className="text-[10px] text-emerald-400">3/3 Zones Live</span>
              </div>
              {loc.sensorZones.map((sz, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-0.5 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{sz.zone}</span>
                  </div>
                  <div className="font-mono text-slate-400">
                    <span>M: {sz.moisture}</span>
                    <span className="mx-1 text-slate-600">|</span>
                    <span>T: {sz.temp}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
