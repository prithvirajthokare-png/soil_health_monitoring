import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import TeamProjectView from './components/TeamProjectView';
import StatusBar from './components/StatusBar';
import { fetchFullLocationState } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'team'
  const [zoomLevel, setZoomLevel] = useState(15);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');

  // Backend Live State
  const [locationData, setLocationData] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const state = await fetchFullLocationState('LOC_001');
      if (state.location) {
        setLocationData(state.location);
        setLatestReading(state.latest);
        setEvaluationData(state.evaluation);
        setIsLive(state.isLive);
        setApiError(null);
      } else {
        setApiError(state.error || 'Unable to connect to backend API');
      }
    } catch (err) {
      console.error('[App] Error loading location state:', err);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleResetView = () => {
    if (activeTab !== 'map') {
      setActiveTab('map');
    }
    setTimeout(() => {
      const recenterBtn = document.querySelector('[title="Center on LOC_001"], [title^="Center on"]');
      if (recenterBtn) {
        recenterBtn.click();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar 
        locationData={locationData}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
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
            latestReading={latestReading}
            evaluationData={evaluationData}
            isLoading={isLoading || isRefreshing}
            onZoomUpdate={setZoomLevel}
            onCoordUpdate={setCursorCoords}
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
