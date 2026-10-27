import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline, Polygon, Marker, CircleMarker, Circle, Tooltip } from 'react-leaflet';
import {
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Layers,
  Crosshair,
  MapPin,
  Globe2,
  CheckCircle2,
  RotateCcw,
  Check,
  X,
  Edit,
  Info
} from 'lucide-react';
import LocationMarker from './LocationMarker';
import LayerControl from './LayerControl';
import MetricsOverlay from './MetricsOverlay';

/**
 * Calculates surface polygon area in square meters using spherical geodesic formula (WGS84).
 */
export function calculatePolygonArea(latlngs) {
  if (!latlngs || latlngs.length < 3) return 0;
  const R = 6378137; // Earth's mean radius in meters
  let area = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % latlngs.length];
    const lon1 = (p1.lng ?? p1[1]) * Math.PI / 180;
    const lon2 = (p2.lng ?? p2[1]) * Math.PI / 180;
    const lat1 = (p1.lat ?? p1[0]) * Math.PI / 180;
    const lat2 = (p2.lat ?? p2[0]) * Math.PI / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2);
}

function MapDrawLayers({
  activeDrawingMode,
  locType,
  drawnPoints,
  setDrawnPoints,
  selectedPoint,
  setSelectedPoint,
  onFinish
}) {
  useMapEvents({
    click(e) {
      if (!activeDrawingMode) return;
      if (locType === 'POINT' || locType === 'PLANT') {
        setSelectedPoint(e.latlng);
      } else if (locType === 'FIELD') {
        setDrawnPoints(prev => [...prev, e.latlng]);
      }
    }
  });

  if (!activeDrawingMode) return null;

  return (
    <>
      {/* Field Polygon Rendering */}
      {locType === 'FIELD' && drawnPoints.length >= 3 && (
        <Polygon
          positions={drawnPoints}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.28,
            weight: 3,
            dashArray: '6, 8'
          }}
        />
      )}

      {/* Polyline for < 3 vertices */}
      {locType === 'FIELD' && drawnPoints.length > 0 && drawnPoints.length < 3 && (
        <Polyline
          positions={drawnPoints}
          pathOptions={{
            color: '#10b981',
            weight: 3,
            dashArray: '6, 8'
          }}
        />
      )}

      {/* Vertex markers */}
      {locType === 'FIELD' && drawnPoints.map((p, i) => {
        const isFirst = i === 0;
        return (
          <CircleMarker
            key={i}
            center={p}
            radius={isFirst ? 8 : 6}
            pathOptions={{
              color: isFirst ? '#059669' : '#047857',
              fillColor: isFirst ? '#34d399' : '#10b981',
              fillOpacity: 0.95,
              weight: isFirst ? 3 : 2
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent?.stopPropagation();
                if (isFirst && drawnPoints.length >= 3) {
                  onFinish();
                }
              }
            }}
          >
            <Tooltip permanent={isFirst && drawnPoints.length >= 3} direction="top" offset={[0, -8]}>
              {isFirst && drawnPoints.length >= 3 ? "Click to Close Polygon" : `V${i + 1}`}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Single Plant / Point Visuals */}
      {(locType === 'POINT' || locType === 'PLANT') && selectedPoint && (
        <>
          <Circle
            center={selectedPoint}
            radius={locType === 'PLANT' ? 15 : 25}
            pathOptions={{
              color: '#10b981',
              fillColor: '#34d399',
              fillOpacity: 0.25,
              weight: 1.5,
              dashArray: '4, 6'
            }}
          />
          <CircleMarker
            center={selectedPoint}
            radius={8}
            pathOptions={{
              color: '#047857',
              fillColor: '#10b981',
              fillOpacity: 0.95,
              weight: 3
            }}
          />
        </>
      )}
    </>
  );
}

// Helper controller for deterministic camera movement
function MapInstanceCapture({ setMap }) {
  const map = useMap();
  useEffect(() => { setMap(map); }, [map, setMap]);
  return null;
}

function MapController({ targetLat, targetLng, targetId, boundsToFit, onZoomChange, onMouseMoveCoord }) {
  const map = useMap();
  const lastAnimatedIdRef = useRef(null);

  useEffect(() => {
    if (boundsToFit && boundsToFit.length >= 2) {
      lastAnimatedIdRef.current = 'BOUNDS';
      map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.8 });
      return;
    }

    if (targetLat !== undefined && targetLng !== undefined && targetId) {
      if (lastAnimatedIdRef.current !== targetId) {
        lastAnimatedIdRef.current = targetId;
        map.flyTo([targetLat, targetLng], 15, {
          duration: 0.8,
          easeLinearity: 0.25
        });
      }
    }
  }, [targetLat, targetLng, targetId, boundsToFit, map]);

  useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
    mousemove(e) {
      onMouseMoveCoord(e.latlng);
    }
  });

  return null;
}

export default function MapView({
  locationData,
  locationsList = [],
  selectedLocationId = 'LOC_001',
  onSelectLocation,
  latestReading,
  evaluationData,
  isLoading,
  onZoomUpdate,
  onCoordUpdate,
  zoomLevel,
  drawingMode,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing
}) {
  const [localDrawingMode, setLocalDrawingMode] = useState(null);
  const activeDrawingMode = drawingMode || localDrawingMode;

  const [drawnPoints, setDrawnPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [locType, setLocType] = useState('FIELD');

  // Synchronize drawing points and type with activeDrawingMode
  useEffect(() => {
    if (activeDrawingMode) {
      setLocType(activeDrawingMode.locationType || 'FIELD');
      const pts = activeDrawingMode.fieldBoundary || activeDrawingMode.polygon;
      if (Array.isArray(pts) && pts.length > 0) {
        setDrawnPoints(pts.map(p => ({ lat: p.lat ?? p[0], lng: p.lng ?? p[1] })));
      } else {
        setDrawnPoints([]);
      }
      if (activeDrawingMode.latitude && activeDrawingMode.longitude && (activeDrawingMode.locationType === 'POINT' || activeDrawingMode.locationType === 'PLANT')) {
        setSelectedPoint({ lat: Number(activeDrawingMode.latitude), lng: Number(activeDrawingMode.longitude) });
      } else {
        setSelectedPoint(null);
      }
    } else {
      setDrawnPoints([]);
      setSelectedPoint(null);
      setLocalDrawingMode(null);
    }
  }, [activeDrawingMode]);

  // Live Geodesic Area Calculation
  const liveArea = useMemo(() => {
    if (locType !== 'FIELD' || drawnPoints.length < 3) return null;
    const areaM2 = calculatePolygonArea(drawnPoints);
    const acres = (areaM2 / 4046.8564224).toFixed(2);
    const ha = (areaM2 / 10000).toFixed(2);
    return { areaM2, acres, ha };
  }, [drawnPoints, locType]);

  const handleUndo = () => {
    setDrawnPoints(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDrawnPoints([]);
  };

  const handleFinish = () => {
    if (drawnPoints.length < 3) {
      alert('Field boundary must have at least 3 vertices to form a valid polygon.');
      return;
    }

    const areaM2 = calculatePolygonArea(drawnPoints);
    const areaAcres = (areaM2 / 4046.8564224).toFixed(2);

    const lats = drawnPoints.map(p => p.lat ?? p[0]);
    const lngs = drawnPoints.map(p => p.lng ?? p[1]);
    const centerLat = Number((lats.reduce((a, b) => a + b, 0) / lats.length).toFixed(7));
    const centerLng = Number((lngs.reduce((a, b) => a + b, 0) / lngs.length).toFixed(7));

    handleInternalFinishDrawing({
      ...activeDrawingMode,
      locationType: 'FIELD',
      fieldBoundary: drawnPoints,
      fieldArea: areaAcres,
      areaUnit: 'acres',
      latitude: centerLat,
      longitude: centerLng
    });
  };

  const handleConfirmPoint = () => {
    if (!selectedPoint) {
      alert('Please click on the map to set coordinates first.');
      return;
    }
    handleInternalFinishDrawing({
      ...activeDrawingMode,
      locationType: locType,
      latitude: Number(selectedPoint.lat.toFixed(7)),
      longitude: Number(selectedPoint.lng.toFixed(7)),
      fieldBoundary: null,
      fieldArea: null,
      areaUnit: null
    });
  };

  const handleResetPoint = () => {
    setSelectedPoint(null);
  };

  const handleCancelDrawing = () => {
    setDrawnPoints([]);
    setSelectedPoint(null);
    handleInternalCancelDrawing();
  };

  // Resolve active location directly
  const activeLocation = useMemo(() => {
    if (activeDrawingMode && activeDrawingMode.latitude && activeDrawingMode.longitude) {
      return {
        id: activeDrawingMode.id || activeDrawingMode.farmId || 'DRAFT',
        name: activeDrawingMode.name || 'Draft Location',
        latitude: Number(activeDrawingMode.latitude),
        longitude: Number(activeDrawingMode.longitude)
      };
    }
    return locationsList.find(l => l.id === selectedLocationId) ||
      locationsList[0] ||
      { id: 'LOC_001', name: 'Idea Factory', latitude: 13.0094631, longitude: 74.7952437 };
  }, [locationsList, selectedLocationId, activeDrawingMode]);

  const lat = activeLocation.latitude;
  const lng = activeLocation.longitude;
  const locId = activeLocation.id;
  const locName = activeLocation.name;

  const [currentZoom, setCurrentZoom] = useState(15);
  const [boundsToFit, setBoundsToFit] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [showOverlay, setShowOverlay] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showLocationsPanel, setShowLocationsPanel] = useState(false);
  const [showPlotToolPanel, setShowPlotToolPanel] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState(selectedLocationId);
  const [selectedPlotType, setSelectedPlotType] = useState('FIELD');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInfoBanner, setMapInfoBanner] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const mapContainerRef = useRef(null);

  // Sync selected plot with selected location
  useEffect(() => {
    if (selectedLocationId) {
      setSelectedPlotId(selectedLocationId);
    }
  }, [selectedLocationId]);

  // Basemap Tile Providers
  const tileProviders = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Earthstar Geographics, Maxar, CNES/Airbus DS'
    },
    hybrid: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar & USGS Imagery'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    }
  };

  const labelsLayer = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

  const handleRecenter = () => {
    setBoundsToFit(null);
    mapInstance?.flyTo([lat, lng], 15, { duration: 0.6 });
  };

  const handleZoomIn = () => { mapInstance?.zoomIn(); };
  const handleZoomOut = () => { mapInstance?.zoomOut(); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleSelectAndFly = (id) => {
    setBoundsToFit(null);
    const target = locationsList.find(l => l.id === id);
    if (target && target.latitude && target.longitude) {
      mapInstance?.flyTo([target.latitude, target.longitude], 15, { duration: 0.8 });
    }
    if (onSelectLocation) {
      onSelectLocation(id);
    }
    setShowLocationsPanel(false);
  };

  const handleFitAllLocations = () => {
    const validCoords = locationsList
      .filter(l => l.latitude && l.longitude)
      .map(l => [l.latitude, l.longitude]);

    if (validCoords.length >= 2) {
      setBoundsToFit(validCoords);
    } else {
      handleRecenter();
    }
    setShowLocationsPanel(false);
  };

  // Launch drawing mode from toolbar
  const handleStartDrawFromToolbar = () => {
    const plotLoc = locationsList.find(l => l.id === selectedPlotId) || activeLocation;
    const initialPoints = plotLoc.fieldBoundary || [];

    const drawPayload = {
      ...plotLoc,
      farmId: plotLoc.id,
      locationType: selectedPlotType,
      fieldBoundary: initialPoints
    };

    setShowPlotToolPanel(false);
    setMapInfoBanner(false);
    setLocalDrawingMode(drawPayload);

    if (onStartDrawing) {
      onStartDrawing(drawPayload);
    }
  };

  const handleInternalFinishDrawing = (updatedLoc) => {
    setLocalDrawingMode(null);
    setDrawnPoints([]);
    setSelectedPoint(null);
    if (onFinishDrawing) {
      onFinishDrawing(updatedLoc);
    }
  };

  const handleInternalCancelDrawing = () => {
    setLocalDrawingMode(null);
    setShowPlotToolPanel(false);
    setMapInfoBanner(false);
    setDrawnPoints([]);
    setSelectedPoint(null);
    if (onCancelDrawing) {
      onCancelDrawing();
    }
  };

  const activePlotLocation = locationsList.find(l => l.id === selectedPlotId) || activeLocation;

  return (
    <div ref={mapContainerRef} className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">

      {/* Floating Drawing Control HUD (Top-Center, outside MapContainer to avoid event interception) */}
      {activeDrawingMode && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw]"
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Header Info */}
            <div className="flex flex-col min-w-[180px]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm">
                  {locType === 'FIELD' ? 'Drawing Field Polygon' : (locType === 'PLANT' ? 'Plot Plant Coordinate' : 'Plot Point Coordinate')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono truncate max-w-[110px]">
                  {activeDrawingMode.name || activeDrawingMode.farmerName || activeDrawingMode.id || 'Selected Plot'}
                </span>
              </div>
              <span className="text-slate-400 text-xs mt-0.5">
                {locType === 'FIELD'
                  ? (drawnPoints.length === 0
                      ? 'Click map to place vertex 1.'
                      : (drawnPoints.length < 3
                          ? `Add ${3 - drawnPoints.length} more vertex to close polygon.`
                          : 'Click 1st point or Confirm Boundary when done.'))
                  : (selectedPoint
                      ? `Selected: ${selectedPoint.lat.toFixed(6)}°, ${selectedPoint.lng.toFixed(6)}°`
                      : 'Click map to place coordinate.')}
              </span>
            </div>

            {/* Field Type Selector Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: 'FIELD', label: 'Field Polygon' },
                { id: 'PLANT', label: 'Plant' },
                { id: 'POINT', label: 'Point' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setLocType(type.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    locType === type.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Real-time Field Area Badge */}
            {locType === 'FIELD' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
                <span className="text-slate-400">Area:</span>
                {liveArea ? (
                  <span className="text-emerald-400 font-bold">
                    {liveArea.acres} acres <span className="text-slate-500 font-normal">({liveArea.ha} ha)</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    {drawnPoints.length}/3 pts (min 3)
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {locType === 'FIELD' && (
                <>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={drawnPoints.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
                    title="Remove last vertex"
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={drawnPoints.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
                    title="Reset all vertices and redraw"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={drawnPoints.length < 3}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center gap-1.5"
                    title="Validate and confirm boundary"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Boundary
                  </button>
                </>
              )}

              {(locType === 'POINT' || locType === 'PLANT') && (
                <>
                  <button
                    type="button"
                    onClick={handleResetPoint}
                    disabled={!selectedPoint}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPoint}
                    disabled={!selectedPoint}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Location
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCancelDrawing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
                title="Cancel drawing without saving"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Notice */}
      {!activeDrawingMode && mapInfoBanner && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-slate-200 px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2.5 text-xs select-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">Active Plot:</span>
          <span className="text-emerald-400 font-mono font-bold">{locId} ({locName})</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{locationsList.length} Monitored Sites</span>
          <button
            onClick={() => setMapInfoBanner(false)}
            className="text-slate-400 hover:text-slate-200 ml-1 font-bold"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Leaflet Map Canvas */}
      <MapContainer
        center={[lat, lng]}
        zoom={currentZoom}
        zoomControl={false}
        attributionControl={false}
        className={`w-full h-full z-0 ${activeDrawingMode ? "cursor-crosshair" : ""}`}
      >
        <MapInstanceCapture setMap={setMapInstance} />
        <MapDrawLayers
          activeDrawingMode={activeDrawingMode}
          locType={locType}
          drawnPoints={drawnPoints}
          setDrawnPoints={setDrawnPoints}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
          onFinish={handleFinish}
        />
        <MapController
          targetLat={lat}
          targetLng={lng}
          targetId={locId}
          boundsToFit={boundsToFit}
          onZoomChange={(z) => {
            setCurrentZoom(z);
            onZoomUpdate?.(z);
          }}
          onMouseMoveCoord={(coords) => {
            onCoordUpdate?.(coords);
          }}
        />

        {/* Primary Basemap Layer */}
        <TileLayer
          key={activeLayer}
          url={tileProviders[activeLayer]?.url || tileProviders.satellite.url}
          maxZoom={19}
          subdomains={['a', 'b', 'c']}
        />

        {/* Overlay Labels (when Hybrid is chosen) */}
        {activeLayer === 'hybrid' && (
          <TileLayer
            url={labelsLayer}
            maxZoom={19}
            opacity={0.85}
          />
        )}

        {/* Render Location Markers & Polygons on Map */}
        {locationsList.map((loc) => {
          const isSelected = loc.id === locId;
          return (
            <LocationMarker
              key={loc.id}
              locationData={isSelected ? { ...loc, ...locationData } : loc}
              latestReading={isSelected ? latestReading : null}
              evaluationData={isSelected ? evaluationData : null}
              showOverlay={showOverlay}
              isSelected={isSelected}
              onSelect={handleSelectAndFly}
            />
          );
        })}
      </MapContainer>

      {/* Floating Action Controls on Map (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">

        {/* Sites / Locations Switcher on Map */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLocationsPanel(!showLocationsPanel);
              setShowLayerPanel(false);
              setShowPlotToolPanel(false);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-2 text-xs font-semibold transition-all ${
              showLocationsPanel
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/30'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Switch Monitored Locations"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Sites ({locationsList.length})</span>
          </button>

          {/* Locations Dropdown on Map */}
          {showLocationsPanel && (
            <div className="absolute top-12 left-0 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2 z-30 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 flex justify-between items-center">
                <span>Select Field Location</span>
                <span className="font-mono text-emerald-400">{locId}</span>
              </div>

              {locationsList.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleSelectAndFly(l.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                    l.id === locId
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${l.id === locId ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                    <div>
                      <div className="font-bold text-slate-100 truncate max-w-[150px]">{l.farmerName ? `${l.farmerName} Farm` : (l.name || 'Demo Location')}</div>
                      <div className="text-[10px] text-slate-400">{l.village ? `${l.village}, ${l.state}` : l.id}</div>
                    </div>
                  </div>
                  {l.id === locId ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      {l.id === 'LOC_001' ? 'Real' : 'Simulated'}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={handleFitAllLocations}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2 text-[11px]"
                >
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Show All Sites (Fit Map)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Boundary & Plot Selection Tool */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPlotToolPanel(!showPlotToolPanel);
              setShowLocationsPanel(false);
              setShowLayerPanel(false);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-2 text-xs font-semibold transition-all ${
              showPlotToolPanel || activeDrawingMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/30'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Draw or Edit Field Boundary / Plot Selection"
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">Boundary & Plots</span>
          </button>

          {showPlotToolPanel && (
            <div className="absolute top-12 left-0 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 z-30 text-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Field / Plot Tool</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedPlotId}</span>
              </div>

              {/* Plot Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Select Plot / Location</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => {
                    setSelectedPlotId(e.target.value);
                    handleSelectAndFly(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {locationsList.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.farmerName ? `${l.farmerName} Farm` : (l.name || l.id)} ({l.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Type Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Field Type</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-center">
                  {[
                    { id: 'FIELD', label: 'Field' },
                    { id: 'PLANT', label: 'Plant' },
                    { id: 'POINT', label: 'Point' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedPlotType(t.id)}
                      className={`py-1 rounded text-xs font-semibold transition-colors ${
                        selectedPlotType === t.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Plot Boundary Info */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Registered Boundary:</span>
                  <span className="font-semibold text-slate-200">
                    {activePlotLocation?.fieldBoundary?.length ? `${activePlotLocation.fieldBoundary.length} vertices` : 'None defined'}
                  </span>
                </div>
                {activePlotLocation?.fieldArea && (
                  <div className="flex justify-between text-slate-400">
                    <span>Field Area:</span>
                    <span className="font-mono text-emerald-400 font-bold">{activePlotLocation.fieldArea} {activePlotLocation.areaUnit || 'acres'}</span>
                  </div>
                )}
              </div>

              {/* Trigger Drawing Button */}
              <button
                type="button"
                onClick={handleStartDrawFromToolbar}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                {activePlotLocation?.fieldBoundary?.length ? 'Redraw Plot Boundary' : 'Draw Boundary on Map'}
              </button>
            </div>
          )}
        </div>

        {/* Layer Toggle Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayerPanel(!showLayerPanel);
              setShowLocationsPanel(false);
              setShowPlotToolPanel(false);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-2 text-xs font-semibold transition-all ${
              showLayerPanel
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/30'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Switch Map Layers"
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">Map Layers</span>
          </button>

          {/* Layer Selection Dropdown */}
          {showLayerPanel && (
            <div className="absolute top-12 left-0 z-30">
              <LayerControl
                activeLayer={activeLayer}
                onChangeLayer={(l) => {
                  setActiveLayer(l);
                  setShowLayerPanel(false);
                }}
                showOverlay={showOverlay}
                onToggleOverlay={setShowOverlay}
              />
            </div>
          )}
        </div>

        {/* Recenter Quick Button */}
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md shadow-xl transition-all flex items-center gap-2 text-xs font-medium"
          title={`Center on ${locId}`}
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Center Site</span>
        </button>
      </div>

      {/* Map Zoom & Navigation Controls (Bottom-Left) */}
      <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-800 mx-1"></div>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-800 mx-1"></div>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Right HUD: Soil Metrics Overlay */}
      <div className="absolute top-4 right-4 bottom-6 z-20 flex items-start justify-end pointer-events-none">
        <div className="pointer-events-auto">
          <MetricsOverlay
            locationData={activeLocation}
            latestReading={latestReading}
            evaluationData={evaluationData}
            onFocusLocation={handleRecenter}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Satellite Imagery Credit Overlay */}
      <div className="absolute bottom-2 right-2 z-10 bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono pointer-events-none">
        Satellite Imagery: Esri / Earthstar / Google Maps Compatible
      </div>

    </div>
  );
}
