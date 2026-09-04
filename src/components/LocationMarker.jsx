import React from 'react';
import { Marker, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { 
  Droplets, 
  Thermometer, 
  TestTube2, 
  MapPin, 
  Activity,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

// Custom DivIcon for LOC markers with radar pulsing ring
const createCustomMarkerIcon = (code = 'LOC_001', isSelected = true) => {
  const isPrimary = code === 'LOC_001';
  const colorGrad = isSelected 
    ? (isPrimary ? 'from-emerald-700 via-emerald-500 to-teal-400' : 'from-cyan-700 via-cyan-500 to-blue-400')
    : 'from-slate-700 via-slate-600 to-slate-500';

  const ringColor = isSelected 
    ? (isPrimary ? 'bg-emerald-500/30' : 'bg-cyan-500/30')
    : 'bg-slate-500/20';

  const badgeColor = isPrimary ? 'text-emerald-400 border-emerald-500/50' : 'text-cyan-300 border-cyan-500/50';

  return L.divIcon({
    className: `custom-soil-marker ${isSelected ? 'marker-selected' : 'marker-inactive'}`,
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        ${isSelected ? `
          <span class="absolute w-12 h-12 rounded-full ${ringColor} marker-radar-ring"></span>
          <span class="absolute w-8 h-8 rounded-full ${ringColor} animate-ping"></span>
        ` : ''}
        
        <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr ${colorGrad} text-slate-950 shadow-xl ring-2 ${isSelected ? 'ring-emerald-300' : 'ring-slate-400'} ring-offset-2 ring-offset-slate-950 cursor-pointer transition-transform hover:scale-125">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-950">
            <path d="M7 20h10"></path>
            <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path>
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path>
          </svg>
        </div>

        <div class="absolute -top-7 whitespace-nowrap bg-slate-900/90 ${badgeColor} text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-md backdrop-blur-sm pointer-events-none">
          ${code}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

export default function LocationMarker({ 
  locationData, 
  latestReading, 
  evaluationData, 
  showOverlay, 
  isSelected = true,
  onSelect 
}) {
  const locId = locationData?.id || 'LOC_001';
  const isLoc1 = locId === 'LOC_001';
  const lat = locationData?.latitude ?? (isLoc1 ? 13.0094631 : 20.1929232);
  const lng = locationData?.longitude ?? (isLoc1 ? 74.7952437 : 76.5352501);
  const position = [lat, lng];

  const locName = locationData?.name || (isLoc1 ? 'Idea Factory' : 'Test Location');
  const cropName = locationData?.current_crop || (isLoc1 ? 'tomato' : 'Unknown / To be provided');
  const soilType = locationData?.soil_type || (isLoc1 ? 'Loamy Silt' : 'Unknown / To be provided');
  const coverageArea = locationData?.coverage_area || (isLoc1 ? '48.5 Hectares' : 'Unknown / To be provided');
  
  const hasTelemetry = isLoc1 ? true : (latestReading !== null && latestReading !== undefined);
  
  const healthScore = evaluationData?.health_score ?? (isLoc1 ? 100 : 0);
  const healthStatus = evaluationData?.health_status || (isLoc1 ? 'Optimal' : 'No Telemetry');

  const moistureVal = isLoc1 ? `${latestReading?.moisture_pct ?? 27.4}%` : (hasTelemetry ? `${latestReading.moisture_pct}%` : '—');
  const phVal = isLoc1 ? (latestReading?.ph ?? 6.78) : (hasTelemetry ? latestReading.ph : '—');
  const tempVal = isLoc1 ? `${latestReading?.temperature_c ?? 21.5}°C` : (hasTelemetry ? `${latestReading.temperature_c}°C` : '—');
  const nVal = isLoc1 ? (latestReading?.nitrogen_mg_kg ?? 52.5) : (hasTelemetry ? latestReading.nitrogen_mg_kg : '—');
  const pVal = isLoc1 ? (latestReading?.phosphorus_mg_kg ?? 27.5) : (hasTelemetry ? latestReading.phosphorus_mg_kg : '—');
  const kVal = isLoc1 ? (latestReading?.potassium_mg_kg ?? 104.0) : (hasTelemetry ? latestReading.potassium_mg_kg : '—');

  const recommendation = evaluationData?.recommendations?.[0] || (
    isLoc1 
      ? 'All soil health metrics for Idea Factory are within optimal agronomic targets.'
      : 'Connect IoT sensor nodes to begin receiving telemetry.'
  );

  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  // Parcel boundary coordinates around dynamic location
  const fieldBoundary = [
    [lat + 0.0035, lng - 0.0040],
    [lat + 0.0037, lng + 0.0042],
    [lat - 0.0035, lng + 0.0040],
    [lat - 0.0037, lng - 0.0042]
  ];

  const handleMarkerClick = () => {
    if (onSelect) {
      onSelect(locId);
    }
  };

  return (
    <>
      {/* Parcel Boundary (shown when selected) */}
      {isSelected && (
        <Polygon 
          positions={fieldBoundary}
          pathOptions={{
            color: isLoc1 ? '#22c55e' : '#06b6d4',
            weight: 2,
            opacity: 0.8,
            dashArray: '6, 6',
            fillColor: showOverlay ? (isLoc1 ? '#22c55e' : '#06b6d4') : '#10b981',
            fillOpacity: showOverlay ? 0.2 : 0.08
          }}
        />
      )}

      {/* Coverage Radius */}
      {isSelected && (
        <Circle 
          center={position} 
          radius={350} 
          pathOptions={{
            color: isLoc1 ? '#10b981' : '#06b6d4',
            weight: 1,
            opacity: 0.4,
            fillColor: isLoc1 ? '#10b981' : '#06b6d4',
            fillOpacity: 0.03
          }}
        />
      )}

      {/* Main Sensor Hub Marker */}
      <Marker 
        position={position} 
        icon={createCustomMarkerIcon(locId, isSelected)}
        eventHandlers={{
          click: handleMarkerClick
        }}
      >
        <Popup maxWidth={360} className="soil-popup">
          <div className="p-4 bg-slate-900/95 text-slate-100 rounded-xl border border-emerald-500/40 shadow-2xl space-y-3 font-sans">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {locId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                    {hasTelemetry ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                    {healthStatus}
                  </span>
                </div>
                <h2 className="font-bold text-sm text-slate-100 mt-1">{locName}</h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{formattedCoords}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Health Index</div>
                <div className={`text-xl font-mono font-bold ${healthScore > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {healthScore}<span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
            </div>

            {/* Quick Metadata Pill Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block">Soil Classification</span>
                <span className="font-medium text-slate-200">{soilType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Current Crop</span>
                <span className="font-medium text-emerald-400 capitalize">{cropName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Coverage Area</span>
                <span className="font-medium text-slate-200">{coverageArea}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Active Sensor ID</span>
                <span className="font-medium text-emerald-400 font-mono">
                  {locationData?.sensor_id || (isLoc1 ? 'SN_001' : 'SN_002')}
                </span>
              </div>
            </div>

            {/* Core Soil Telemetry Metrics */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Soil Telemetry</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {hasTelemetry ? "SQLite Stream" : "No Signal"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Moisture */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-center">
                  <div className="flex items-center justify-center text-blue-400 mb-1">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">Moisture</div>
                  <div className="text-sm font-mono font-bold text-blue-300 mt-1">
                    {moistureVal}
                  </div>
                  <span className={`text-[9px] font-medium ${hasTelemetry ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasTelemetry ? 'Optimal' : 'Offline'}
                  </span>
                </div>

                {/* pH */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-center">
                  <div className="flex items-center justify-center text-purple-400 mb-1">
                    <TestTube2 className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">pH Value</div>
                  <div className="text-sm font-mono font-bold text-purple-300 mt-1">
                    {phVal}
                  </div>
                  <span className={`text-[9px] font-medium ${hasTelemetry ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasTelemetry ? 'Optimal' : 'Offline'}
                  </span>
                </div>

                {/* Temp */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-center">
                  <div className="flex items-center justify-center text-amber-400 mb-1">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">Soil Temp</div>
                  <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                    {tempVal}
                  </div>
                  <span className={`text-[9px] font-medium ${hasTelemetry ? 'text-slate-400' : 'text-slate-500'}`}>
                    {hasTelemetry ? 'Nominal' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* NPK Summary */}
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400 font-medium">NPK Nutrient Balance:</span>
                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-emerald-400">N: {nVal}</span>
                  <span className="text-cyan-400">P: {pVal}</span>
                  <span className="text-amber-400">K: {kVal}</span>
                </div>
              </div>
            </div>

            {/* Live Agronomic Recommendation */}
            <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Agronomic Recommendation</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {recommendation}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Node {locId}</span>
              </span>
              <span className="font-mono text-emerald-400">
                {hasTelemetry ? 'Stream Connected' : 'Test Node Ready'}
              </span>
            </div>

          </div>
        </Popup>
      </Marker>
    </>
  );
}
