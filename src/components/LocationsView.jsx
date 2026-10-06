import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Edit, 
  Map, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Radio
} from 'lucide-react';

export default function LocationsView({ locationsList, setLocationsList, setActiveTab, onSelectLocation, onStartDrawing, draftLocationData, clearDraft }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    state: 'All',
    crop: 'All',
    locationStatus: 'All',
    sensorStatus: 'All',
    alertStatus: 'All',
    locationType: 'All'
  });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Extract unique values for filters
  const uniqueStates = useMemo(() => ['All', ...new Set(locationsList.map(l => l.state).filter(Boolean))], [locationsList]);
  const uniqueCrops = useMemo(() => ['All', ...new Set(locationsList.map(l => l.crop).filter(Boolean))], [locationsList]);

  const filteredLocations = useMemo(() => {
    return locationsList.filter(l => {
      const q = search.toLowerCase();
      const matchesSearch = 
        l.farmerName?.toLowerCase().includes(q) ||
        l.farmName?.toLowerCase().includes(q) ||
        l.village?.toLowerCase().includes(q) ||
        l.district?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q) ||
        l.sensorId?.toLowerCase().includes(q) ||
        l.crop?.toLowerCase().includes(q);

      const matchesState = filters.state === 'All' || l.state === filters.state;
      const matchesCrop = filters.crop === 'All' || l.crop === filters.crop;
      const matchesLocationStatus = filters.locationStatus === 'All' || l.locationStatus === filters.locationStatus;
      const matchesSensorStatus = filters.sensorStatus === 'All' || l.sensorStatus === filters.sensorStatus;
      const matchesAlertStatus = filters.alertStatus === 'All' || l.alertStatus === filters.alertStatus;
      const matchesLocationType = filters.locationType === 'All' || l.locationType === filters.locationType;

      return matchesSearch && matchesState && matchesCrop && matchesLocationStatus && matchesSensorStatus && matchesAlertStatus && matchesLocationType;
    });
  }, [locationsList, search, filters]);

  const handleResetFilters = () => {
    setSearch('');
    setFilters({
      state: 'All',
      crop: 'All',
      locationStatus: 'All',
      sensorStatus: 'All',
      alertStatus: 'All',
      locationType: 'All'
    });
  };

  const handleViewOnMap = (locId) => {
    onSelectLocation(locId);
    // Already sets active tab to map in App.jsx via onSelectLocation
  };

  const saveLocation = (formData) => {
    if (isAdding) {
      const newLoc = { ...formData, id: `DEMO_NEW_${Date.now()}` };
      if (newLoc.locationStatus === 'DEMO' && newLoc.simulatedTelemetry) {
         const recs = newLoc.simulatedTelemetry.evaluation.recommendations;
         if (recs && recs[0] && recs[0].includes('optimal for')) {
             newLoc.simulatedTelemetry.evaluation.recommendations = [`All soil metrics are optimal for ${newLoc.crop}.`];
         }
      }
      setLocationsList([newLoc, ...locationsList]);
    } else if (isEditing && selectedLocation) {
      setLocationsList(locationsList.map(l => {
        if (l.id === selectedLocation.id) {
           const updated = { ...l, ...formData };
           if (updated.locationStatus === 'DEMO' && updated.simulatedTelemetry) {
               const recs = updated.simulatedTelemetry.evaluation.recommendations;
               if (recs && recs[0] && recs[0].includes('optimal for')) {
                   updated.simulatedTelemetry = {
                       ...updated.simulatedTelemetry,
                       evaluation: {
                           ...updated.simulatedTelemetry.evaluation,
                           recommendations: [`All soil metrics are optimal for ${updated.crop}.`]
                       }
                   };
               }
           }
           return updated;
        }
        return l;
      }));
    }
    setIsAdding(false);
    setIsEditing(false);
    setSelectedLocation(null);
  };

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-400" />
              Locations
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor and manage agricultural locations across the network.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main List Area */}
        <div className="flex-1 flex flex-col overflow-y-auto max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
          
          {/* Search and Filters */}
          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-4">
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search farmer, farm, village, district, state or sensor..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Filter className="w-4 h-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">Filters:</span>
              </div>
              
              <select value={filters.locationStatus} onChange={(e) => setFilters({...filters, locationStatus: e.target.value})} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none focus:border-emerald-500">
                <option value="All">All Statuses</option>
                <option value="LIVE">Live</option>
                <option value="DEMO">Demo</option>
              </select>

              <select value={filters.state} onChange={(e) => setFilters({...filters, state: e.target.value})} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none focus:border-emerald-500">
                {uniqueStates.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
              </select>
              
              <select value={filters.crop} onChange={(e) => setFilters({...filters, crop: e.target.value})} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none focus:border-emerald-500">
                {uniqueCrops.map(c => <option key={c} value={c}>{c === 'All' ? 'All Crops' : c}</option>)}
              </select>

              <select value={filters.alertStatus} onChange={(e) => setFilters({...filters, alertStatus: e.target.value})} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none focus:border-emerald-500">
                <option value="All">All Alerts</option>
                <option value="NORMAL">Normal</option>
                <option value="WARNING">Warning</option>
              </select>

              {(search || Object.values(filters).some(v => v !== 'All')) && (
                <button onClick={handleResetFilters} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium ml-2">
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Location Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filteredLocations.map(loc => (
              <div key={loc.id} className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 flex flex-col shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg">{loc.farmerName}</h3>
                    <p className="text-xs text-slate-400">{loc.village}, {loc.state}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.locationStatus === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    {loc.locationStatus === 'LIVE' ? '🟢 LIVE' : '🔵 DEMO'}
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-lg">🌾</span>
                    <span>{loc.crop}</span>
                    <span className="text-slate-600">•</span>
                    <span>{loc.fieldArea} {loc.areaUnit}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Radio className={`w-4 h-4 ${loc.sensorStatus === 'ONLINE' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="font-mono text-slate-400">{loc.sensorId}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {loc.healthStatus === 'Healthy' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className={loc.healthStatus === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'}>
                      {loc.healthStatus}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedLocation(loc)}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
            
            {filteredLocations.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No locations match your search or filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Details Panel */}
      {selectedLocation && !isEditing && !isAdding && (
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Location Details</h2>
            <button onClick={() => setSelectedLocation(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedLocation.locationStatus === 'DEMO' && (
              <div className="bg-blue-950/40 border border-blue-500/30 text-blue-300 p-3 rounded-lg flex items-start gap-2 text-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p>Demo location — live telemetry not connected.</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Farmer & Farm</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-200">{selectedLocation.farmerName}</div>
                  <div className="text-sm text-slate-400">{selectedLocation.farmName}</div>
                  <div className="text-sm text-slate-400">{selectedLocation.village}, {selectedLocation.district}</div>
                  <div className="text-sm text-slate-400">{selectedLocation.state}, {selectedLocation.country}</div>
                  <div className="text-xs text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
                    GPS: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Agronomic Details</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Crop</span>
                    <span className="font-semibold text-emerald-400">{selectedLocation.crop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Field Area</span>
                    <span>{selectedLocation.fieldArea} {selectedLocation.areaUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Started</span>
                    <span>{selectedLocation.cropCycleStart}</span>
                  </div>
                  
                  {selectedLocation.cropHistory && selectedLocation.cropHistory.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-800/80">
                      <span className="text-xs uppercase text-slate-500 font-semibold mb-2 block">Crop History</span>
                      <div className="space-y-1.5">
                        {selectedLocation.cropHistory.map((h, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{h.crop}</span>
                            <span className="text-slate-500">{h.startDate} to {h.endDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Hardware & Status</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sensor ID</span>
                    <span className="font-mono">{selectedLocation.sensorId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sensor Status</span>
                    <span className={selectedLocation.sensorStatus === 'ONLINE' ? 'text-emerald-400' : 'text-slate-500'}>{selectedLocation.sensorStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health Status</span>
                    <span className={selectedLocation.healthStatus === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'}>{selectedLocation.healthStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alert Status</span>
                    <span className={selectedLocation.alertStatus === 'NORMAL' ? 'text-emerald-400' : 'text-amber-400'}>{selectedLocation.alertStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 grid grid-cols-2 gap-3 bg-slate-950">
            <button 
              onClick={() => handleViewOnMap(selectedLocation.id)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg font-semibold transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>View on Map</span>
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 py-2.5 rounded-lg font-semibold transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(isAdding || isEditing) && (
        <LocationForm 
          location={draftLocationData || (isEditing ? selectedLocation : null)} 
          onSave={saveLocation} 
          onCancel={() => {
            setIsAdding(false);
            setIsEditing(false);
            if (clearDraft) clearDraft();
          }}
          onStartDrawing={(formData) => {
            if (clearDraft) clearDraft();
            if (onStartDrawing) {
              onStartDrawing({ ...formData, isEditing, isAdding });
            }
          }}
        />
      )}
    </div>
  );
}

function LocationForm({ location, onSave, onCancel, onStartDrawing }) {
  const [formData, setFormData] = useState(location || {
    farmerName: '', farmName: '', village: '', district: '', state: '', 
    country: 'India', crop: '', cropCycleStart: '', cropCycleEnd: '', 
    fieldArea: '', areaUnit: 'acres', locationType: 'FIELD', sensorId: '', sensorStatus: 'ONLINE',
    locationStatus: 'DEMO', alertStatus: 'NORMAL', healthStatus: 'Healthy', latitude: 20, longitude: 77,
    cropHistory: []
  });

  const [isChangingCrop, setIsChangingCrop] = useState(false);
  const [newCrop, setNewCrop] = useState('');
  const [newCropStart, setNewCropStart] = useState('');

  React.useEffect(() => {
    if (location) {
      setFormData(location);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmCropChange = () => {
    setFormData(prev => {
      const history = prev.cropHistory ? [...prev.cropHistory] : [];
      if (prev.crop) {
        history.unshift({
          crop: prev.crop,
          startDate: prev.cropCycleStart || 'Unknown',
          endDate: new Date().toISOString().split('T')[0]
        });
      }
      return {
        ...prev,
        crop: newCrop,
        cropCycleStart: newCropStart,
        cropHistory: history
      };
    });
    setIsChangingCrop(false);
    setNewCrop('');
    setNewCropStart('');
  };

  const isRealLocation = formData.id === 'LOC_001';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">
            {location ? 'Edit Location' : 'Add New Location'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isRealLocation && (
            <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 p-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              This is the live configuration. Metadata can be edited, but telemetry connections cannot be changed here.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Farmer Name</label>
              <input name="farmerName" value={formData.farmerName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Farm Name</label>
              <input name="farmName" value={formData.farmName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Village</label>
              <input name="village" value={formData.village} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">District</label>
              <input name="district" value={formData.district} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">State</label>
              <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            {location ? (
              <div className="col-span-1 md:col-span-2 border border-slate-800 p-4 rounded-xl bg-slate-900/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500">Current Crop</label>
                    <div className="font-bold text-emerald-400 text-lg mt-0.5">{formData.crop}</div>
                    <div className="text-sm text-slate-400">Started: {formData.cropCycleStart || 'Unknown'}</div>
                  </div>
                  {!isChangingCrop && (
                    <button type="button" onClick={() => setIsChangingCrop(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold text-slate-200 transition-colors">
                      Change Crop
                    </button>
                  )}
                </div>

                {isChangingCrop && (
                  <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-lg space-y-4">
                    <div className="text-sm font-bold text-emerald-400">Start New Crop Cycle</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">New Crop</label>
                        <select value={newCrop} onChange={(e) => setNewCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                           <option value="">Select Crop...</option>
                           <option value="Paddy">Paddy</option>
                           <option value="Wheat">Wheat</option>
                           <option value="Sugarcane">Sugarcane</option>
                           <option value="Cotton">Cotton</option>
                           <option value="Arecanut">Arecanut</option>
                           <option value="Coffee">Coffee</option>
                           <option value="Coconut">Coconut</option>
                           <option value="Tea">Tea</option>
                           <option value="Grape">Grape</option>
                           <option value="Groundnut">Groundnut</option>
                           <option value="Chilli">Chilli</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Start Date</label>
                        <input type="date" value={newCropStart} onChange={(e) => setNewCropStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button type="button" onClick={() => setIsChangingCrop(false)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm font-semibold text-slate-300">Cancel</button>
                      <button type="button" onClick={handleConfirmCropChange} disabled={!newCrop || !newCropStart} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-sm font-bold text-white">Confirm Change</button>
                    </div>
                  </div>
                )}

                {formData.cropHistory && formData.cropHistory.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/60">
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2 block">Crop History</label>
                    <div className="space-y-2">
                      {formData.cropHistory.map((h, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-sm">
                          <span className="text-slate-300 font-semibold">{h.crop}</span>
                          <span className="text-slate-500 text-xs">{h.startDate} &ndash; {h.endDate || 'Present'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Crop</label>
                  <select name="crop" value={formData.crop} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                     <option value="">Select Crop...</option>
                     <option value="Paddy">Paddy</option>
                     <option value="Wheat">Wheat</option>
                     <option value="Sugarcane">Sugarcane</option>
                     <option value="Cotton">Cotton</option>
                     <option value="Arecanut">Arecanut</option>
                     <option value="Coffee">Coffee</option>
                     <option value="Coconut">Coconut</option>
                     <option value="Tea">Tea</option>
                     <option value="Grape">Grape</option>
                     <option value="Groundnut">Groundnut</option>
                     <option value="Chilli">Chilli</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Crop Cycle Start</label>
                  <input type="date" name="cropCycleStart" value={formData.cropCycleStart} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Crop Cycle End</label>
                  <input type="date" name="cropCycleEnd" value={formData.cropCycleEnd} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Field Area</label>
              <div className="flex gap-2">
                <input name="fieldArea" value={formData.fieldArea} onChange={handleChange} className="w-2/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                <select name="areaUnit" value={formData.areaUnit} onChange={handleChange} className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                  <option value="acres">acres</option>
                  <option value="hectares">hectares</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Sensor ID</label>
              <input name="sensorId" value={formData.sensorId} onChange={handleChange} disabled={isRealLocation} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Sensor Status</label>
              <select name="sensorStatus" value={formData.sensorStatus} onChange={handleChange} disabled={isRealLocation} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50">
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Location Type</label>
              <select name="locationType" value={formData.locationType} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                <option value="FIELD">FIELD</option>
                <option value="PLANT">SINGLE PLANT</option>
                <option value="POINT">POINT / NO AREA</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-400 flex items-center gap-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0" />
            {formData.locationType === 'FIELD' && <span>Field boundary will be drawn on the map in the next stage.</span>}
            {formData.locationType === 'PLANT' && <span>Plant location will be placed on the map in the next stage.</span>}
            {formData.locationType === 'POINT' && <span>No field boundary will be displayed.</span>}
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 flex justify-between items-center bg-slate-900 rounded-b-2xl">
          <button 
            onClick={() => {
              if (onStartDrawing) {
                onStartDrawing(formData);
              }
            }}
            className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 font-semibold transition-colors flex items-center gap-2 text-sm"
          >
            <Map className="w-4 h-4" />
            Set Location on Map
          </button>
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2 rounded-lg text-slate-300 font-semibold hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave(formData)} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-colors">
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
