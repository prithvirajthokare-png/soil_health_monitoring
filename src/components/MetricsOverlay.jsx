import React, { useState } from 'react';
import { 
  Droplets, 
  Thermometer, 
  TestTube, 
  Gauge, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Compass, 
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function MetricsOverlay({ locationData, latestReading, evaluationData, onFocusLocation, isLoading }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const locId = locationData?.id || 'LOC_001';
  const isLoc1 = locId === 'LOC_001';
  const locName = locationData?.name || (isLoc1 ? 'Idea Factory' : 'Test Location');
  const currentCrop = locationData?.current_crop || (isLoc1 ? 'tomato' : 'Unknown / To be provided');
  const coverageArea = locationData?.coverage_area || (isLoc1 ? '48.5 Hectares' : 'Unknown / To be provided');
  
  // For LOC_001, telemetry is always available (live or baseline demo).
  // For LOC_002, telemetry is genuinely offline unless real readings exist.
  const hasTelemetry = isLoc1 ? true : (latestReading !== null && latestReading !== undefined);
  
  const healthScore = evaluationData?.health_score ?? (isLoc1 ? 100 : 0);
  const healthStatus = evaluationData?.health_status || (isLoc1 ? 'Optimal' : 'No Telemetry');

  const lat = locationData?.latitude ?? (isLoc1 ? 13.0094631 : 20.1929232);
  const lng = locationData?.longitude ?? (isLoc1 ? 74.7952437 : 76.5352501);
  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  // Deterministic values: LOC_001 uses live reading or exact demo baseline (27.4, 6.78, 21.5, 1.18, 52.5, 27.5, 104.0)
  const moisture = isLoc1 ? (latestReading?.moisture_pct ?? 27.4) : (hasTelemetry ? latestReading.moisture_pct : '—');
  const ph = isLoc1 ? (latestReading?.ph ?? 6.78) : (hasTelemetry ? latestReading.ph : '—');
  const temp = isLoc1 ? (latestReading?.temperature_c ?? 21.5) : (hasTelemetry ? latestReading.temperature_c : '—');
  const ec = isLoc1 ? (latestReading?.ec_ds_m ?? 1.18) : (hasTelemetry ? latestReading.ec_ds_m : '—');
  const nVal = isLoc1 ? (latestReading?.nitrogen_mg_kg ?? 52.5) : (hasTelemetry ? latestReading.nitrogen_mg_kg : '—');
  const pVal = isLoc1 ? (latestReading?.phosphorus_mg_kg ?? 27.5) : (hasTelemetry ? latestReading.phosphorus_mg_kg : '—');
  const kVal = isLoc1 ? (latestReading?.potassium_mg_kg ?? 104.0) : (hasTelemetry ? latestReading.potassium_mg_kg : '—');

  const targets = evaluationData?.stage_targets;
  const nTarget = targets?.n_target_mg_kg ?? 53.8;
  const pTarget = targets?.p_target_mg_kg ?? 28.0;
  const kTarget = targets?.k_target_mg_kg ?? 103.0;
  const trigMoisture = targets?.irrigation_trigger_pct ?? 20.0;

  const recommendations = evaluationData?.recommendations || [
    isLoc1 
      ? `All soil health metrics for ${locName} are within optimal agronomic targets.`
      : 'Connect IoT sensor nodes to begin receiving telemetry.'
  ];

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
        <div className="w-80 md:w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl shadow-black/60 text-slate-100 space-y-3.5 max-h-[calc(100vh-120px)] overflow-y-auto">
          
          {/* Header Card */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {locId}
                </span>
                <span className="text-xs text-slate-400">
                  {isLoc1 ? 'Primary Hub' : 'Test Node'}
                </span>
                {isLoading && (
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                )}
              </div>
              <h2 className="font-bold text-base text-slate-100 mt-1">{locName}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-400 font-medium capitalize">{currentCrop}</span>
                <span>•</span>
                <span>{coverageArea}</span>
              </div>
            </div>

            {/* Health Score Dial */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-inner">
              <div className={`text-2xl font-black font-mono leading-none ${healthScore > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {healthScore}
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
                <div className="font-mono text-xs text-slate-200">{formattedCoords}</div>
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

          {/* Agronomic Recommendations Card */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950/80 p-3 rounded-xl border border-emerald-500/40 shadow-md space-y-1.5">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Agronomic Recommendation</span>
            </div>
            <div className="space-y-1">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-200 leading-relaxed">
                  {hasTelemetry ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Telemetry Indicators</span>
              <span className={`flex items-center gap-1 text-[11px] font-normal normal-case ${hasTelemetry ? 'text-emerald-400' : 'text-slate-400'}`}>
                {hasTelemetry ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3 text-slate-500" />} 
                {healthStatus}
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
                  <span className="text-xl font-bold font-mono text-blue-300">{moisture}</span>
                  {hasTelemetry && <span className="text-xs text-slate-400 font-mono">%</span>}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" 
                    style={{ width: hasTelemetry ? `${Math.min(100, (Number(moisture) / 50) * 100)}%` : '0%' }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Trigger: {trigMoisture}%</span>
                  <span className={hasTelemetry ? "text-emerald-400 font-medium" : "text-slate-500"}>
                    {hasTelemetry ? "Optimal" : "No Signal"}
                  </span>
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
                  <span className="text-xl font-bold font-mono text-purple-300">{ph}</span>
                  {hasTelemetry && <span className="text-xs text-slate-400 font-mono">pH</span>}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full" 
                    style={{ width: hasTelemetry ? `${(Number(ph) / 14) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Range: 5.5-7.5</span>
                  <span className={hasTelemetry ? "text-emerald-400 font-medium" : "text-slate-500"}>
                    {hasTelemetry ? "Optimal" : "No Signal"}
                  </span>
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
                  <span className="text-xl font-bold font-mono text-amber-300">{temp}</span>
                  {hasTelemetry && <span className="text-xs text-slate-400 font-mono">°C</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                  <span>Sensor: {locationData?.sensor_id || (isLoc1 ? 'SN_001' : 'SN_002')}</span>
                  <span className={hasTelemetry ? "text-emerald-400 font-medium" : "text-slate-500"}>
                    {hasTelemetry ? "Nominal" : "Offline"}
                  </span>
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
                  <span className="text-xl font-bold font-mono text-teal-300">{ec}</span>
                  {hasTelemetry && <span className="text-xs text-slate-400 font-mono">dS/m</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                  <span>Threshold: 2.5</span>
                  <span className={hasTelemetry ? "text-emerald-400 font-medium" : "text-slate-500"}>
                    {hasTelemetry ? "Safe" : "No Signal"}
                  </span>
                </div>
              </div>

            </div>

            {/* NPK Macronutrients Breakdown */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">NPK Nutrient Balance (mg/kg)</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {hasTelemetry ? "Crop Target Sync" : "No Stream"}
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Nitrogen */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Nitrogen (N)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {hasTelemetry ? `${nVal} / ${nTarget} mg/kg` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      style={{ width: hasTelemetry ? `${Math.min(100, (Number(nVal) / nTarget) * 100)}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                {/* Phosphorus */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Phosphorus (P)</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {hasTelemetry ? `${pVal} / ${pTarget} mg/kg` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="bg-cyan-500 h-1.5 rounded-full" 
                      style={{ width: hasTelemetry ? `${Math.min(100, (Number(pVal) / pTarget) * 100)}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                {/* Potassium */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-400">Potassium (K)</span>
                    <span className="font-mono font-bold text-amber-400">
                      {hasTelemetry ? `${kVal} / ${kTarget} mg/kg` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: hasTelemetry ? `${Math.min(100, (Number(kVal) / kTarget) * 100)}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
