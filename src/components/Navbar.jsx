import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, 
  MapPin, 
  Layers, 
  Users,
  Radio, 
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Map,
  Bell,
  ShieldCheck,
  User,
  LogOut,
  Lock,
  Brain
} from 'lucide-react';
import { downloadHistoricalDataCsv } from '../services/api';

export default function Navbar({ 
  currentUser,
  onLogout,
  onShowLogin,
  locationData, 
  locationsList = [],
  selectedLocationId = 'LOC_001',
  onSelectLocation,
  isLive, 
  isRefreshing, 
  onRefresh, 
  onResetView, 
  activeTab, 
  setActiveTab 
}) {
  const locId = locationData?.id || selectedLocationId;
  const locName = locationData?.farmerName ? `${locationData.farmerName} Farm` : (locationData?.name || (locId === 'LOC_001' ? 'Idea Factory' : 'Demo Location'));

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [downloadingRange, setDownloadingRange] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  
  const downloadRef = useRef(null);
  const locationRef = useRef(null);
  const userRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const isFarmer = currentUser?.role === 'user';
  const isGuest = !currentUser;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (rangeKey, rangeLabel) => {
    try {
      setDownloadingRange(rangeKey);
      setDownloadStatus(null);
      await downloadHistoricalDataCsv(locId, rangeKey);
      setDownloadStatus({ type: 'success', message: `${rangeLabel} CSV downloaded` });
      setTimeout(() => {
        setDownloadStatus(null);
        setShowDownloadMenu(false);
      }, 1500);
    } catch (err) {
      console.error('[Navbar] Download error:', err);
      setDownloadStatus({ type: 'error', message: 'Download failed. Ensure backend is running.' });
    } finally {
      setDownloadingRange(null);
    }
  };

  const downloadOptions = [
    { key: '1week', label: '1 Week', desc: 'Past 7 days of sensor readings' },
    { key: '1month', label: '1 Month', desc: 'Past 30 days of sensor readings' },
    { key: '1year', label: '1 Year', desc: 'Past 365 days of sensor readings' },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 z-30 shrink-0 px-3 md:px-5 py-2 w-full max-w-full">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & System Title */}
        <div 
          onClick={() => setActiveTab(isFarmer ? 'user-dashboard' : 'dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          title="Go to Dashboard Overview"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform">
            <Sprout className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
              TerraPulse
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block">
              v2.0
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
          
          {/* Navigation Item: Farmer Dashboard vs Admin Dashboard */}
          {isFarmer ? (
            <button 
              onClick={() => setActiveTab('user-dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'user-dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>My Farm</span>
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          ) : (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          )}

          {/* Navigation Item: Map */}
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          
          {/* Navigation Item: Locations (Admin/Guest only) */}
          {!isFarmer && (
            <button 
              onClick={() => setActiveTab('locations')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'locations'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locations</span>
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          )}
          
          {/* Navigation Item: Alerts */}
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>

          {/* Navigation Item: Admin Hub (Admin only) */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin-hub')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'admin-hub'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Hub</span>
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          )}

          {/* Navigation Item: Our Team */}
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
        </nav>

        {/* Right Actions: Farm Selector, CSV Export, Sync, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Interactive Multi-Location Selector */}
          <div className="relative" ref={locationRef}>
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 text-xs font-medium transition-colors"
              title="Select Active Field Location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono font-bold text-emerald-400">{locId}</span>
              <span className="text-slate-300 font-medium truncate max-w-[80px] xl:max-w-[120px] hidden md:inline">
                ({locName})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>

            {/* Location Selector Dropdown */}
            {showLocationMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 max-h-[70vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 flex items-center justify-between">
                  <span>{isFarmer ? 'Your Assigned Farm(s)' : 'Select Field Location'}</span>
                  <span className="text-emerald-400 font-mono font-bold">{locationsList.length}</span>
                </div>
                {locationsList.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onSelectLocation?.(l.id);
                      setShowLocationMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      l.id === locId 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold truncate max-w-[180px]">{l.farmerName ? `${l.farmerName} Farm` : (l.name || 'Demo Location')}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{l.id === 'LOC_001' ? 'Real Node' : 'Simulated'} &bull; {l.village || l.id}</div>
                    </div>
                    {l.id === locId && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Data Dropdown Control */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all shadow-sm"
              title="Download historical telemetry as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>

            {/* Dropdown Menu */}
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Export Telemetry (CSV)</span>
                  <span className="font-mono text-emerald-400 text-[10px]">{locId}</span>
                </div>

                {downloadOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleDownload(opt.key, opt.label)}
                    disabled={downloadingRange !== null}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-slate-400">{opt.desc}</div>
                      </div>
                    </div>

                    {downloadingRange === opt.key ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300" />
                    )}
                  </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
                ))}

                {downloadStatus && (
                  <div className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 mt-1 ${
                    downloadStatus.type === 'success' 
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-red-950/80 text-red-300 border border-red-500/40'
                  }`}>
                    {downloadStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="truncate">{downloadStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Action */}
          <button 
            onClick={onRefresh}
            title="Fetch fresh telemetry from FastAPI backend"
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-900 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden lg:inline">Sync</span>
          </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>

          {/* Reset / Focus Button (on map view) */}
          {activeTab === 'map' && (
            <button 
              onClick={onResetView}
              title={`Center Map on ${locId}`}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Locate</span>
            </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
          )}

          {/* User Profile / Authentication Menu */}
          <div className="relative" ref={userRef}>
            {currentUser ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-xs transition-all shadow-sm"
                title="Account Settings & Role"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="font-semibold text-slate-200 truncate max-w-[80px] hidden sm:inline">
                  {currentUser.username}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold hidden xl:inline">
                  {isAdmin ? 'ADMIN' : 'FARMER'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
            ) : (
              <button
                onClick={onShowLogin}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
            )}

            {/* User Dropdown */}
            {showUserMenu && currentUser && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1.5">
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="font-bold text-slate-100">{currentUser.full_name || currentUser.username}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {isAdmin ? 'Administrator' : 'Farmer'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isAdmin ? 'All Sites' : `${currentUser.assigned_farms?.length || 0} Farm(s)`}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin-hub');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Admin Hub</span>
                  </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
          
          {/* Navigation Item: Demo Mode */}
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
