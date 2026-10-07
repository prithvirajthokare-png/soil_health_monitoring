import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import TeamProjectView from './components/TeamProjectView';
import DashboardView from './components/DashboardView';
import LocationsView from './components/LocationsView';
import AlertsView from './components/AlertsView';
import GlobalAlert from './components/GlobalAlert';
import StatusBar from './components/StatusBar';
import { fetchFullLocationState, fetchAllLocations } from './services/api';
import { DEMO_LOC_001_READING, DEMO_LOC_001_EVALUATION } from './data/mockLocation';

import { DEMO_LOCATIONS } from './data/demoLocations';

// Stable deterministic list of the 50 supported locations (1 LIVE, 49 DEMO)
export const SUPPORTED_LOCATIONS = [
  { 
    id: 'LOC_001', 
    name: 'Idea Factory',
    farmerName: 'NITK Surathkal',
    farmName: 'Idea Factory Research Farm',
    village: 'Surathkal',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    country: 'India',
    latitude: 13.0094631, 
    longitude: 74.7952437,
    current_crop: 'tomato',
    crop: 'Tomato',
    soil_type: 'Loamy Silt',
    coverage_area: '119.8 Acres',
    fieldArea: '48.5',
    areaUnit: 'Acres',
    sensor_id: 'SN_001',
    sensorId: 'SN_001',
    sensorStatus: 'ONLINE',
    locationStatus: 'LIVE',
    locationType: 'FIELD',
    alertStatus: 'NORMAL',
    healthStatus: 'Healthy',
    cropCycleStart: '2025-10-01',
    cropCycleEnd: '2026-12-01',
    fieldBoundary: null,
    cropHistory: ['Tomato'],
    installationDate: '2024-05-15'
  },
  ...DEMO_LOCATIONS
];


const getInitialLocations = () => {
  let list = [...SUPPORTED_LOCATIONS];
  try {
    const geomOverride = JSON.parse(localStorage.getItem('loc_001_geometry'));
    if (geomOverride) {
      list = list.map(l => l.id === 'LOC_001' ? { ...l, ...geomOverride } : l);
    }
  } catch (e) {}
  return list;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'map' | 'locations' | 'alerts' | 'team'
  const [zoomLevel, setZoomLevel] = useState(15);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [drawingMode, setDrawingMode] = useState(null);
  const [draftLocationData, setDraftLocationData] = useState(null);

  // Multi-location State
  const [selectedLocationId, setSelectedLocationId] = useState('LOC_001');
  const [locationsList, setLocationsList] = useState(getInitialLocations());

  // Backend Live State with deterministic LOC_001 demo baseline
  const [locationData, setLocationData] = useState(getInitialLocations()[0]);
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
        const merged = getInitialLocations().map(sup => {
          const remote = locs.find(l => l.id === sup.id);
          if (remote && sup.locationStatus === 'LIVE') {
             const mergedLoc = { ...sup, ...remote };
             if (mergedLoc.id === 'LOC_001') {
               try {
                 const geomOverride = JSON.parse(localStorage.getItem('loc_001_geometry'));
                 if (geomOverride) {
                   Object.assign(mergedLoc, geomOverride);
                 }
               } catch (e) {}
             }
             return mergedLoc;
          }
          return sup;
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

    // If DEMO location, use simulated telemetry immediately and avoid hitting the backend
    if (baseLoc.locationStatus === 'DEMO') {
      setIsLive(false);
      setLatestReading(baseLoc.simulatedTelemetry?.reading || null);
      setEvaluationData(baseLoc.simulatedTelemetry?.evaluation || null);
      setIsLoading(false);
      setIsRefreshing(false);
      setApiError(null);
      return;
    }

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
        setLocationData(prev => {
          const updated = { ...prev, ...state.location };
          if (updated.id === 'LOC_001') {
            try {
              const geomOverride = JSON.parse(localStorage.getItem('loc_001_geometry'));
              if (geomOverride) {
                Object.assign(updated, geomOverride);
              }
            } catch(e) {}
          }
          return updated;
        });
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
            health_score: baseLoc.healthStatus === 'Healthy' ? 85 : 45,
            health_status: baseLoc.locationStatus === 'DEMO' ? 'Demo Telemetry' : 'No Telemetry',
            recommendations: baseLoc.locationStatus === 'DEMO' ? ['Demo location - telemetry disconnected.'] : ['Connect IoT sensor nodes to begin receiving telemetry.']
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
            health_score: baseLoc.healthStatus === 'Healthy' ? 85 : 45,
            health_status: baseLoc.locationStatus === 'DEMO' ? 'Demo Telemetry' : 'No Telemetry',
            recommendations: baseLoc.locationStatus === 'DEMO' ? ['Demo location - telemetry disconnected.'] : ['Connect IoT sensor nodes to begin receiving telemetry.']
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
            health_score: baseLoc.healthStatus === 'Healthy' ? 85 : 45,
            health_status: baseLoc.locationStatus === 'DEMO' ? 'Demo Telemetry' : 'No Telemetry',
            recommendations: baseLoc.locationStatus === 'DEMO' ? ['Demo location - telemetry disconnected.'] : ['Connect IoT sensor nodes to begin receiving telemetry.']
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
    if (!locId) return;
    
    // Immediate synchronous state update
    setSelectedLocationId(locId);
    
    const targetBase = locationsList.find(l => l.id === locId) || 
      SUPPORTED_LOCATIONS.find(l => l.id === locId);
    if (targetBase) {
      setLocationData(targetBase);
      if (locId === 'LOC_001') {
        setLatestReading(DEMO_LOC_001_READING);
        setEvaluationData(DEMO_LOC_001_EVALUATION);
      } else if (targetBase.locationStatus === 'DEMO') {
        setLatestReading(targetBase.simulatedTelemetry?.reading || null);
        setEvaluationData(targetBase.simulatedTelemetry?.evaluation || null);
      } else {
        setLatestReading(null);
        setEvaluationData({
          health_score: targetBase.healthStatus === 'Healthy' ? 85 : 45,
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
      <GlobalAlert 
        locationData={locationData} 
        evaluationData={evaluationData}
        latestReading={latestReading}
        onViewLocation={handleSelectLocation}
      />
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
        {activeTab === 'dashboard' && (
          <div className="w-full h-full block">
            <DashboardView 
              locationData={locationData}
              latestReading={latestReading}
              evaluationData={evaluationData}
              locationsList={locationsList}
              setActiveTab={setActiveTab}
            />
          </div>
        )}
        
        {activeTab === 'map' && (
          <div className="w-full h-full flex flex-col block">
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
              drawingMode={drawingMode}
              onFinishDrawing={(updatedLoc) => {
                setDrawingMode(null);
                setDraftLocationData(updatedLoc);
                setActiveTab('locations');
              }}
              onCancelDrawing={() => {
                setDrawingMode(null);
                setActiveTab('locations');
              }}
            />
          </div>
        )}

        <div className={`w-full h-full flex flex-col ${activeTab === 'locations' ? 'block' : 'hidden'}`}>
          <LocationsView 
            locationsList={locationsList} 
            setLocationsList={setLocationsList}
            setActiveTab={setActiveTab}
            onSelectLocation={handleSelectLocation}
            draftLocationData={draftLocationData}
            clearDraft={() => setDraftLocationData(null)}
            onStartDrawing={(formData) => {
              setDrawingMode(formData);
              setActiveTab('map');
            }}
          />
        </div>

        {activeTab === 'alerts' && (
          <div className="w-full h-full block">
            <AlertsView 
              locationsList={locationsList}
              onSelectLocation={handleSelectLocation}
            />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="w-full h-full overflow-y-auto block">
            <TeamProjectView 
              locationData={locationData}
              onBackToMap={() => setActiveTab('map')} 
            />
          </div>
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
