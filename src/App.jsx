import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import TeamProjectView from './components/TeamProjectView';
import StatusBar from './components/StatusBar';
import { fetchFullLocationState, fetchAllLocations } from './services/api';
import { DEMO_LOC_001_READING, DEMO_LOC_001_EVALUATION } from './data/mockLocation';

// Stable deterministic list of the 2 supported locations
export const SUPPORTED_LOCATIONS = [
  { 
    id: 'LOC_001', 
    name: 'Idea Factory', 
    latitude: 13.0094631, 
    longitude: 74.7952437,
    current_crop: 'tomato',
    soil_type: 'Loamy Silt',
    coverage_area: '48.5 Hectares',
    sensor_id: 'SN_001'
  },
  { 
    id: 'LOC_002', 
    name: 'Test Location', 
    latitude: 20.1929232, 
    longitude: 76.5352501,
    current_crop: 'Unknown / To be provided',
    soil_type: 'Unknown / To be provided',
    coverage_area: 'Unknown / To be provided',
    sensor_id: 'SN_002'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'team'
  const [zoomLevel, setZoomLevel] = useState(15);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');

  // Multi-location State
  const [selectedLocationId, setSelectedLocationId] = useState('LOC_001');
  const [locationsList, setLocationsList] = useState(SUPPORTED_LOCATIONS);

  // Backend Live State with deterministic LOC_001 demo baseline
  const [locationData, setLocationData] = useState(SUPPORTED_LOCATIONS[0]);
  const [latestReading, setLatestReading] = useState(DEMO_LOC_001_READING);
  const [evaluationData, setEvaluationData] = useState(DEMO_LOC_001_EVALUATION);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Ref to track latest request ID and prevent out-of-order race conditions
  const activeRequestIdRef = useRef(0);
  const lastCoordUpdateTimeRef = useRef(0);

  // Fetch all available locations from backend
  const loadLocationsList = useCallback(async () => {
    try {
      const locs = await fetchAllLocations();
      if (Array.isArray(locs) && locs.length > 0) {
        // Merge with supported coordinates to ensure zero missing geometry
        const merged = SUPPORTED_LOCATIONS.map(sup => {
          const remote = locs.find(l => l.id === sup.id);
          return remote ? { ...sup, ...remote } : sup;
        });
        setLocationsList(merged);
      }
    } catch (err) {
      console.warn('[App] Backend not reachable, using baseline locations:', err.message);
    }
  }, []);

  // Fetch telemetry and evaluation for selected location
  const loadData = useCallback(async (locationId = selectedLocationId, isManual = false) => {
    const requestId = ++activeRequestIdRef.current;
    
    // Find synchronous base metadata so UI updates immediately with 0ms lag
    const baseLoc = locationsList.find(l => l.id === locationId) || 
      SUPPORTED_LOCATIONS.find(l => l.id === locationId) || 
      SUPPORTED_LOCATIONS[0];
    
    setLocationData(baseLoc);

    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const state = await fetchFullLocationState(locationId);
      
      // If a newer request was initiated while this one was in flight, discard this result
      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      if (state.location) {
        setLocationData(prev => ({ ...prev, ...state.location }));
        if (state.latest) {
          setLatestReading(state.latest);
        } else if (locationId === 'LOC_001') {
          setLatestReading(DEMO_LOC_001_READING);
        } else {
          setLatestReading(null);
        }

        if (state.evaluation) {
          setEvaluationData(state.evaluation);
        } else if (locationId === 'LOC_001') {
          setEvaluationData(DEMO_LOC_001_EVALUATION);
        } else {
          setEvaluationData({
            health_score: 0,
            health_status: 'No Telemetry',
            recommendations: ['Connect IoT sensor nodes to begin receiving telemetry.']
          });
        }

        setIsLive(state.isLive);
        setApiError(null);
      } else {
        // Backend offline / error: preserve demo baseline for LOC_001
        setIsLive(false);
        if (locationId === 'LOC_001') {
          setLatestReading(DEMO_LOC_001_READING);
          setEvaluationData(DEMO_LOC_001_EVALUATION);
        } else {
          setLatestReading(null);
          setEvaluationData({
            health_score: 0,
            health_status: 'No Telemetry',
            recommendations: ['Connect IoT sensor nodes to begin receiving telemetry.']
          });
        }
        setApiError(state.error || 'Backend offline');
      }
    } catch (err) {
      if (requestId === activeRequestIdRef.current) {
        setIsLive(false);
        if (locationId === 'LOC_001') {
          setLatestReading(DEMO_LOC_001_READING);
          setEvaluationData(DEMO_LOC_001_EVALUATION);
        } else {
          setLatestReading(null);
          setEvaluationData({
            health_score: 0,
            health_status: 'No Telemetry',
            recommendations: ['Connect IoT sensor nodes to begin receiving telemetry.']
          });
        }
        setApiError(err.message);
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [locationsList, selectedLocationId]);

  useEffect(() => {
    loadLocationsList();
  }, [loadLocationsList]);

  useEffect(() => {
    loadData(selectedLocationId, false);
  }, [selectedLocationId, loadData]);

  const handleSelectLocation = useCallback((locId) => {
    if (!locId || (locId !== 'LOC_001' && locId !== 'LOC_002')) return;
    
    // Immediate synchronous state update
    setSelectedLocationId(locId);
    
    const targetBase = locationsList.find(l => l.id === locId) || 
      SUPPORTED_LOCATIONS.find(l => l.id === locId);
    if (targetBase) {
      setLocationData(targetBase);
      if (locId === 'LOC_001') {
        setLatestReading(DEMO_LOC_001_READING);
        setEvaluationData(DEMO_LOC_001_EVALUATION);
      } else {
        setLatestReading(null);
        setEvaluationData({
          health_score: 0,
          health_status: 'No Telemetry',
          recommendations: ['Connect IoT sensor nodes to begin receiving telemetry.']
        });
      }
    }

    if (activeTab !== 'map') {
      setActiveTab('map');
    }
  }, [activeTab, locationsList]);

  // Throttled cursor coordinates update to prevent 60fps full-app re-renders
  const handleCoordUpdate = useCallback((coords) => {
    const now = performance.now();
    if (now - lastCoordUpdateTimeRef.current > 120) {
      lastCoordUpdateTimeRef.current = now;
      setCursorCoords(coords);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (activeTab !== 'map') {
      setActiveTab('map');
    }
    setTimeout(() => {
      const recenterBtn = document.querySelector(`[title^="Center on"], [title^="Target"]`);
      if (recenterBtn) {
        recenterBtn.click();
      }
    }, 50);
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar 
        locationData={locationData}
        locationsList={locationsList}
        selectedLocationId={selectedLocationId}
        onSelectLocation={handleSelectLocation}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          loadLocationsList();
          loadData(selectedLocationId, true);
        }}
        onResetView={handleResetView} 
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex">
        {activeTab === 'map' ? (
          <MapView 
            locationData={locationData}
            locationsList={locationsList}
            selectedLocationId={selectedLocationId}
            onSelectLocation={handleSelectLocation}
            latestReading={latestReading}
            evaluationData={evaluationData}
            isLoading={isLoading || isRefreshing}
            onZoomUpdate={setZoomLevel}
            onCoordUpdate={handleCoordUpdate}
            zoomLevel={zoomLevel}
          />
        ) : (
          <TeamProjectView 
            locationData={locationData}
            onBackToMap={() => setActiveTab('map')} 
          />
        )}
      </main>

      {/* Bottom Industrial Status Bar */}
      <StatusBar 
        locationData={locationData}
        zoomLevel={zoomLevel} 
        cursorCoords={cursorCoords} 
        activeTab={activeTab}
        isLive={isLive}
      />
    </div>
  );
}
