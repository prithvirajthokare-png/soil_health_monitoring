import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Layers, 
  Crosshair,
  MapPin,
  Globe2
} from 'lucide-react';
import LocationMarker from './LocationMarker';
import LayerControl from './LayerControl';
import MetricsOverlay from './MetricsOverlay';

// Helper component for map interaction hooks and events
function MapController({ center, zoom, boundsToFit, onZoomChange, onMouseMoveCoord }) {
  const map = useMap();

  useEffect(() => {
    if (boundsToFit && boundsToFit.length >= 2) {
      map.fitBounds(boundsToFit, { padding: [50, 50], duration: 1.2 });
    } else if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, boundsToFit, map]);

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
  zoomLevel 
}) {
  const lat = locationData?.latitude ?? 13.0094631;
  const lng = locationData?.longitude ?? 74.7952437;
  const locId = locationData?.id || selectedLocationId;
  const locName = locationData?.name || (locId === 'LOC_001' ? 'Idea Factory' : 'Test Location');

  const [mapCenter, setMapCenter] = useState([lat, lng]);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [boundsToFit, setBoundsToFit] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [showOverlay, setShowOverlay] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showLocationsPanel, setShowLocationsPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInfoBanner, setMapInfoBanner] = useState(true);
  const mapContainerRef = useRef(null);

  // Update map center when active location changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      setBoundsToFit(null);
      setMapCenter([locationData.latitude, locationData.longitude]);
      setCurrentZoom(15);
    }
  }, [locationData?.latitude, locationData?.longitude, selectedLocationId]);

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
    setMapCenter([lat, lng]);
    setCurrentZoom(15);
  };

  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 19));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 4));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Build list of markers to render (from backend locations list or fallback)
  const markersToRender = locationsList.length > 0 ? locationsList : [
    locationData || { id: 'LOC_001', name: 'Idea Factory', latitude: 13.0094631, longitude: 74.7952437 },
    { id: 'LOC_002', name: 'Test Location', latitude: 20.1929232, longitude: 76.5352501 }
  ];

  const handleFitAllLocations = () => {
    const bounds = markersToRender.map(m => [m.latitude, m.longitude]);
    setBoundsToFit(bounds);
    setShowLocationsPanel(false);
  };

  return (
    <div ref={mapContainerRef} className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
      
      {/* Top Banner Notice (Satellite Map Active) */}
      {mapInfoBanner && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-slate-200 px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2.5 text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">Satellite GIS Active</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-mono">{locId} ({locName})</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{markersToRender.length} Monitored Sites</span>
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
        className="w-full h-full z-0 cursor-crosshair"
      >
        <MapController 
          center={mapCenter} 
          zoom={currentZoom} 
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

        {/* Render Location Markers on Map */}
        {markersToRender.map((loc) => {
          const isSelected = loc.id === locId;
          return (
            <LocationMarker 
              key={loc.id}
              locationData={isSelected ? locationData || loc : loc}
              latestReading={isSelected ? latestReading : null}
              evaluationData={isSelected ? evaluationData : null}
              showOverlay={showOverlay} 
              isSelected={isSelected}
              onSelect={onSelectLocation}
            />
          );
        })}
      </MapContainer>

      {/* Floating Action Controls on Map (Left / Top-Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        
        {/* Sites / Locations Switcher on Map */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLocationsPanel(!showLocationsPanel);
              setShowLayerPanel(false);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-2 text-xs font-semibold transition-all ${
              showLocationsPanel 
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/30' 
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Switch Monitored Locations"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Sites ({markersToRender.length})</span>
          </button>

          {/* Locations Dropdown on Map */}
          {showLocationsPanel && (
            <div className="absolute top-12 left-0 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2 z-30 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 flex justify-between items-center">
                <span>Monitored Locations</span>
                <span className="font-mono text-emerald-400">{locId}</span>
              </div>
              
              {markersToRender.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    onSelectLocation?.(l.id);
                    setShowLocationsPanel(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                    l.id === locId 
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' 
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${l.id === locId ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                    <div>
                      <div className="font-bold font-mono text-slate-100">{l.id}</div>
                      <div className="text-[11px] text-slate-400">{l.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {l.id === 'LOC_001' ? 'Real Site' : 'Test Node'}
                  </span>
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

        {/* Layer Toggle Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayerPanel(!showLayerPanel);
              setShowLocationsPanel(false);
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

        {/* Recenter Quick Button for Active Location */}
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md shadow-xl transition-all flex items-center gap-2 text-xs font-medium"
          title={`Center on ${locId} (${locName})`}
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Target {locId}</span>
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
            locationData={locationData}
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
