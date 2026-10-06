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
const createCustomMarkerIcon = (loc, isSelected = true) => {
  const isLive = loc.locationStatus === 'LIVE';
  const labelText = loc.farmerName || loc.name || loc.id;
  
  const colorGrad = isSelected 
    ? (isLive ? 'from-emerald-700 via-emerald-500 to-teal-400' : 'from-cyan-700 via-cyan-500 to-blue-400')
    : (isLive ? 'from-emerald-800 to-emerald-600' : 'from-slate-700 via-slate-600 to-slate-500');

  const ringColor = isSelected 
    ? (isLive ? 'bg-emerald-500/30' : 'bg-cyan-500/30')
    : 'bg-slate-500/20';

  const badgeColor = isLive ? 'text-emerald-400 border-emerald-500/50' : 'text-cyan-300 border-cyan-500/50';

  return L.divIcon({
    className: `custom-soil-marker group ${isSelected ? 'marker-selected z-50' : 'marker-inactive'}`,
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        ${isSelected ? `
          <span class="absolute w-12 h-12 rounded-full ${ringColor} marker-radar-ring"></span>
          <span class="absolute w-8 h-8 rounded-full ${ringColor} animate-ping"></span>
        ` : ''}
        
        <div class="relative z-10 flex items-center justify-center ${isSelected ? 'w-8 h-8' : 'w-4 h-4'} rounded-full bg-gradient-to-tr ${colorGrad} text-slate-950 shadow-xl ring-2 ${isSelected ? 'ring-emerald-300' : 'ring-slate-400'} ring-offset-2 ring-offset-slate-950 cursor-pointer transition-transform hover:scale-125">
          ${isSelected ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-950"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>` : ''}
        </div>

        <div class="absolute -top-7 whitespace-nowrap bg-slate-900/95 ${badgeColor} text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-md backdrop-blur-sm pointer-events-none transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
          ${labelText}
        </div>
      </div>
    `,
    iconSize: isSelected ? [32, 32] : [16, 16],
    iconAnchor: isSelected ? [16, 16] : [8, 8],
    popupAnchor: [0, -10]
  });
};

const LocationMarker = React.memo(({ locationData, latestReading, evaluationData, showOverlay, isSelected = true, onSelect }) => {
  const locId = locationData?.id || 'LOC_001';
  const isLive = locationData?.locationStatus === 'LIVE';
  const lat = locationData?.latitude ?? 20.0;
  const lng = locationData?.longitude ?? 77.0;
  const position = [lat, lng];

  const locName = locationData?.farmName || locationData?.name || 'Unknown Location';
  const farmerName = locationData?.farmerName || 'Unknown Farmer';
  const cropName = locationData?.crop || locationData?.current_crop || 'Unknown';
  const soilType = locationData?.soil_type || 'Unknown';
  const coverageArea = locationData?.fieldArea ? `${locationData.fieldArea} ${locationData.areaUnit}` : (locationData?.coverage_area || 'Unknown');
  
  // For LIVE locations, telemetry is considered available if latestReading exists or it's LOC_001 demo baseline.
  const isDemo = locationData?.locationStatus === 'DEMO';
  const hasTelemetry = (isLive || isDemo) && (locId === 'LOC_001' || (latestReading !== null && latestReading !== undefined));
  
  const healthScore = hasTelemetry ? (evaluationData?.health_score ?? (locId === 'LOC_001' ? 100 : 0)) : 0;
  const healthStatus = hasTelemetry ? (evaluationData?.health_status || 'Optimal') : (isDemo ? 'SIMULATED' : 'No Signal');

  const moistureVal = hasTelemetry ? (locId === 'LOC_001' ? `${latestReading?.moisture_pct ?? 27.4}%` : `${latestReading.moisture_pct}%`) : '—';
  const phVal = hasTelemetry ? (locId === 'LOC_001' ? (latestReading?.ph ?? 6.78) : latestReading.ph) : '—';
  const tempVal = hasTelemetry ? (locId === 'LOC_001' ? `${latestReading?.temperature_c ?? 21.5}°C` : `${latestReading.temperature_c}°C`) : '—';
  const nVal = hasTelemetry ? (locId === 'LOC_001' ? (latestReading?.nitrogen_mg_kg ?? 52.5) : latestReading.nitrogen_mg_kg) : '—';
  const pVal = hasTelemetry ? (locId === 'LOC_001' ? (latestReading?.phosphorus_mg_kg ?? 27.5) : latestReading.phosphorus_mg_kg) : '—';
  const kVal = hasTelemetry ? (locId === 'LOC_001' ? (latestReading?.potassium_mg_kg ?? 104.0) : latestReading.potassium_mg_kg) : '—';

  const recommendation = hasTelemetry 
    ? (evaluationData?.recommendations?.[0] || (locId === 'LOC_001' ? 'All soil health metrics are within optimal agronomic targets.' : 'Metrics within operational bounds.'))
    : (isDemo ? 'Simulated demo telemetry shown.' : 'Demo location — telemetry disconnected.');

  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  // Use the actual field boundary if available, else standard rect around point if FIELD type
  const fieldBoundary = locationData?.fieldBoundary || (locationData?.locationType !== 'POINT' && locationData?.locationType !== 'PLANT' ? [
    [lat + 0.0035, lng - 0.0040],
    [lat + 0.0037, lng + 0.0042],
    [lat - 0.0035, lng + 0.0040],
    [lat - 0.0037, lng - 0.0042]
  ] : null);

  const handleMarkerClick = () => {
    if (onSelect) {
      onSelect(locId);
    }
  };

  return (
    <>
      {/* Parcel Boundary (shown when selected or hovered) */}
      {isSelected && fieldBoundary && (
        <Polygon 
          positions={fieldBoundary}
          pathOptions={{
            color: isLive ? '#22c55e' : '#3b82f6',
            weight: 2,
            opacity: 0.8,
            dashArray: '6, 6',
            fillColor: showOverlay ? (isLive ? '#22c55e' : '#3b82f6') : '#10b981',
            fillOpacity: showOverlay ? 0.2 : 0.08
          }}
        />
      )}

      {/* Coverage Radius */}
      {isSelected && locationData?.locationType !== 'POINT' && locationData?.locationType !== 'PLANT' && !fieldBoundary && (
        <Circle 
          center={position} 
          radius={350} 
          pathOptions={{
            color: isLive ? '#10b981' : '#3b82f6',
            weight: 1,
            opacity: 0.4,
            fillColor: isLive ? '#10b981' : '#3b82f6',
            fillOpacity: 0.03
          }}
        />
      )}

      {/* Main Sensor Hub Marker */}
      <Marker 
        position={position} 
        icon={createCustomMarkerIcon(locationData, isSelected)}
        eventHandlers={{
          click: handleMarkerClick
        }}
      >
        <Popup maxWidth={360} className="soil-popup">
          <div className="p-4 bg-slate-900/95 text-slate-100 rounded-xl border border-emerald-500/40 shadow-2xl space-y-3 font-sans">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${isLive ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' : 'text-blue-400 bg-blue-950/80 border-blue-500/40'}`}>
                    {isLive ? 'LIVE NODE' : 'DEMO MODE'}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${isLive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {hasTelemetry ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                    {healthStatus}
                  </span>
                </div>
                <h2 className="font-bold text-base text-slate-50 leading-tight">{locName}</h2>
                <h3 className="font-semibold text-sm text-slate-300 mb-1">{farmerName}</h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-emerald-400">{cropName}</span>
                  <span>&bull;</span>
                  <span>{coverageArea}</span>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{locationData?.village}, {locationData?.state}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Health Index</div>
                <div className={`text-xl font-mono font-bold ${healthScore > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {hasTelemetry ? healthScore : '—'}<span className="text-xs text-slate-400">/100</span>
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
                  {locationData?.sensorId || locationData?.sensor_id || (isLive ? 'SN_001' : 'DEMO')}
                </span>
              </div>
            </div>

            {!hasTelemetry ? (
              <div className="bg-slate-950/60 p-4 text-center rounded-lg border border-slate-800/80 text-sm text-slate-400">
                <AlertCircle className="w-5 h-5 mx-auto mb-2 text-slate-500" />
                No telemetry
                <div className="text-xs mt-1">Telemetry disconnected</div>
              </div>
            ) : (
              <>
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
              </>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Node {locId}</span>
              </span>
              <span className="font-mono text-emerald-400">
                {isLive ? (hasTelemetry ? 'Stream Connected' : 'Hardware Offline') : 'DEMO MODE'}
              </span>
            </div>

          </div>
        </Popup>
      </Marker>
    </>
  );
});

export default LocationMarker;