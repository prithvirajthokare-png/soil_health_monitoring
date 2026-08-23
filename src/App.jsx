import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import TeamProjectView from './components/TeamProjectView';
import StatusBar from './components/StatusBar';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'team'
  const [zoomLevel, setZoomLevel] = useState(15);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [activeLayer, setActiveLayer] = useState('satellite');

  const handleResetView = () => {
    if (activeTab !== 'map') {
      setActiveTab('map');
    }
    setTimeout(() => {
      const recenterBtn = document.querySelector('[title="Center on LOC_001"]');
      if (recenterBtn) {
        recenterBtn.click();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar 
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
            onZoomUpdate={setZoomLevel}
            onCoordUpdate={setCursorCoords}
            zoomLevel={zoomLevel}
          />
        ) : (
          <TeamProjectView onBackToMap={() => setActiveTab('map')} />
        )}
      </main>

      {/* Bottom Industrial Status Bar */}
      <StatusBar 
        zoomLevel={zoomLevel} 
        cursorCoords={cursorCoords} 
        activeTab={activeTab}
      />
    </div>
  );
}
