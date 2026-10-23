import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sprout, 
  MapPin, 
  Droplets, 
  Thermometer, 
  TestTube, 
  Gauge, 
  Activity, 
  Download, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Radio, 
  Layers, 
  FileSpreadsheet, 
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  BrainCircuit,
  FileText,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { downloadHistoricalDataCsv, fetchIrrigationPrediction } from '../services/api';
import SoilReportModal from './SoilReportModal';
import AiInsightsCard from './AiInsightsCard';

export default function UserDashboardView({
  currentUser,
  locationData,
  latestReading,
  evaluationData,
  assignedLocations = [],
  onSelectLocation,
  setActiveTab
}) {
  const [downloadingRange, setDownloadingRange] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const loc = locationData || assignedLocations[0] || {};
  const locId = loc.id || 'LOC_001';
  const farmName = loc.farmerName ? `${loc.farmerName} Farm` : (loc.farmName || loc.name || 'My Farm');

  const hasReading = latestReading !== null && latestReading !== undefined;
  
  // Readings (falling back gracefully to LOC_001 baseline if live sensor data is offline)
  const moisture = hasReading ? latestReading.moisture_pct : 27.4;
  const temp = hasReading ? latestReading.temperature_c : 21.5;
  const ph = hasReading ? latestReading.ph : 6.78;
  const ec = hasReading ? latestReading.ec_ds_m : 1.18;
  const nVal = hasReading ? latestReading.nitrogen_mg_kg : 52.5;
  const pVal = hasReading ? latestReading.phosphorus_mg_kg : 27.5;
  const kVal = hasReading ? latestReading.potassium_mg_kg : 104.0;
  const battery = hasReading ? latestReading.battery_pct : 98.0;

  const healthScore = evaluationData?.health_score ?? 85;
  const healthStatus = evaluationData?.health_status || (healthScore >= 80 ? 'Optimal' : (healthScore >= 50 ? 'Sub-optimal' : 'Critical'));

  const targets = evaluationData?.stage_targets;
  const nTarget = targets?.n_target_mg_kg ?? 53.8;
  const pTarget = targets?.p_target_mg_kg ?? 28.0;
  const kTarget = targets?.k_target_mg_kg ?? 103.0;
  const triggerMoisture = targets?.irrigation_trigger_pct ?? 20.0;

  const recommendations = evaluationData?.recommendations || [
    `All soil health metrics for ${farmName} are currently within optimal target thresholds.`,
    `Maintain scheduled irrigation schedule; soil moisture is currently optimal.`
  ];

  // Load irrigation prediction whenever location changes
  const loadPrediction = useCallback(async () => {
    setPredictionLoading(true);
    try {
      const result = await fetchIrrigationPrediction(locId);
      setPrediction(result);
    } catch (e) {
      setPrediction(null);
    } finally {
      setPredictionLoading(false);
    }
  }, [locId]);

  useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  const handleDownload = async (rangeKey, rangeLabel) => {
    try {
      setDownloadingRange(rangeKey);
      setDownloadStatus(null);
      await downloadHistoricalDataCsv(locId, rangeKey);
      setDownloadStatus({ type: 'success', message: `${rangeLabel} CSV exported successfully` });
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (err) {
      setDownloadStatus({ type: 'error', message: 'Export failed. Please check network/backend.' });
    } finally {
      setDownloadingRange(null);
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6 font-sans">
      
      {/* Welcome Banner for Regular Farmer */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Farmer Portal
            </span>
            <span className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">{currentUser?.full_name || currentUser?.username}</strong>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-50 tracking-tight flex items-center gap-2.5">
            <span>{farmName}</span>
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {locId}
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-2 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{loc.village || 'Surathkal'}, {loc.district || 'Dakshina Kannada'}, {loc.state || 'Karnataka'}</span>
            <span>&bull;</span>
            <span>Sensor Pod</span>
          </p>
        </div>

        {/* Assigned Farms Switcher (if user owns > 1 farm) */}
        {assignedLocations.length > 1 && (
          <div className="flex flex-col gap-1.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Assigned Farm
            </span>
            <div className="flex flex-wrap gap-2">
              {assignedLocations.map(al => (
                <button
                  key={al.id}
                  onClick={() => onSelectLocation(al.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    al.id === locId
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{al.farmerName ? `${al.farmerName}` : al.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Real-time AI Agronomic Neural Engine & Crop Intelligence Card */}
        <AiInsightsCard 
          locationData={loc} 
          latestReading={latestReading} 
          setActiveTab={setActiveTab} 
        />
        
        {/* Real-Time Sensor Telemetry Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Soil Metrics & Target Benchmarks</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Last Uplink: {latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleTimeString() : 'Recent'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Moisture */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Soil Moisture</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-400">{moisture}%</div>
              <div className="text-[11px] text-slate-400">
                Trigger: <strong className="text-slate-200">{triggerMoisture}%</strong>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (moisture / 50) * 100)}%` }}></div>
              </div>
            </div>

            {/* pH */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Soil pH</span>
                <TestTube className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{ph}</div>
              <div className="text-[11px] text-slate-400">
                Optimal: <strong className="text-slate-200">6.0 – 7.5</strong>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (ph / 14) * 100)}%` }}></div>
              </div>
            </div>

            {/* Electrical Conductivity (EC) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Conductivity (EC)</span>
                <Gauge className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">{ec} <span className="text-xs">dS/m</span></div>
              <div className="text-[11px] text-slate-400">
                Threshold: <strong className="text-slate-200">&lt; 2.5 dS/m</strong>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (ec / 4) * 100)}%` }}></div>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Temperature</span>
                <Thermometer className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">{temp}°C</div>
              <div className="text-[11px] text-slate-400">
                Range: <strong className="text-slate-200">18°C – 32°C</strong>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (temp / 45) * 100)}%` }}></div>
              </div>
            </div>

            {/* Nitrogen (N) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Nitrogen (N)</span>
                <span className="text-[10px] font-mono text-emerald-400">Target: {nTarget}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{nVal} <span className="text-xs text-slate-400">mg/kg</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (nVal / 100) * 100)}%` }}></div>
              </div>
            </div>

            {/* Phosphorus (P) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Phosphorus (P)</span>
                <span className="text-[10px] font-mono text-emerald-400">Target: {pTarget}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{pVal} <span className="text-xs text-slate-400">mg/kg</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (pVal / 60) * 100)}%` }}></div>
              </div>
            </div>

            {/* Potassium (K) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Potassium (K)</span>
                <span className="text-[10px] font-mono text-emerald-400">Target: {kTarget}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{kVal} <span className="text-xs text-slate-400">mg/kg</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (kVal / 200) * 100)}%` }}></div>
              </div>
            </div>

            {/* Node Battery */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Node Battery</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{battery}%</div>
              <div className="text-[11px] text-slate-400">Status: <strong className="text-emerald-400">Good</strong></div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${battery}%` }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Top Highlight Cards: Health Score & Farm Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Health Index Card */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Overall Soil Health Index
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Automated Agronomic Score
                </h3>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                healthScore >= 80 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : (healthScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30')
              }`}>
                <Activity className="w-3.5 h-3.5" />
                <span>{healthStatus}</span>
              </div>
            </div>

            <div className="py-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-slate-800 bg-slate-950/60 shadow-inner shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black font-mono text-emerald-400">{healthScore}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Out of 100</div>
                </div>
              </div>
              <div className="space-y-2 text-xs w-full">
                <div className="flex justify-between text-slate-300">
                  <span>Soil Classification:</span>
                  <span className="font-bold text-slate-100">{loc.soil_type || 'Loamy Silt'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pod Status:</span>
                  <span className="font-bold text-emerald-400">Active Sensor Node</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Wireless Node:</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    <span>{loc.sensor_id || loc.sensorId || 'SN_001'} (Online)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Telemetry Node: Dragino RS485-LN</span>
              <button
                onClick={() => setActiveTab('map')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>View on Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Actionable Recommendations Card */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                    Agronomic Recommendations & Advisory
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Target-Driven
                </span>
              </div>

              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Export historical bar */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Telemetry Records (CSV):</span>
              </span>
              <div className="flex items-center gap-2">
                {[
                  { key: '1week', label: '1 Week' },
                  { key: '1month', label: '1 Month' },
                  { key: '1year', label: '1 Year' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleDownload(opt.key, opt.label)}
                    disabled={downloadingRange !== null}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {downloadingRange === opt.key ? (
                      <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {downloadStatus && (
              <div className={`mt-2 p-2 rounded-xl text-xs flex items-center gap-2 ${
                downloadStatus.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/80 text-red-300 border border-red-500/40'
              }`}>
                {downloadStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                <span>{downloadStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* ──── AI FEATURES SECTION ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Predictive Irrigation Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30">
                  <BrainCircuit className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">AI Forecast</span>
                  <h3 className="text-sm font-bold text-slate-100 -mt-0.5">Irrigation Prediction</h3>
                </div>
              </div>
              <button
                onClick={loadPrediction}
                disabled={predictionLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors"
                title="Refresh prediction"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${predictionLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {predictionLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400 animate-pulse">Analyzing moisture trend…</span>
              </div>
            ) : prediction ? (
              <div className="space-y-3">
                {/* Urgency Banner */}
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
                  prediction.urgency === 'critical' ? 'bg-red-950/40 border-red-800/50 text-red-300' :
                  prediction.urgency === 'warning' ? 'bg-yellow-950/40 border-yellow-800/50 text-yellow-300' :
                  'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                }`}>
                  {prediction.urgency === 'critical' ? <AlertTriangle className="w-4 h-4 shrink-0" /> :
                   prediction.urgency === 'warning' ? <Clock className="w-4 h-4 shrink-0" /> :
                   <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <p className="text-xs leading-snug">{prediction.message}</p>
                </div>

                {/* Prediction Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/60 rounded-xl p-3 text-center border border-slate-800">
                    <p className="text-[9px] uppercase text-slate-500 font-semibold">Current VWC</p>
                    <p className="text-lg font-mono font-bold text-slate-100">
                      {prediction.current_moisture_pct?.toFixed(1) ?? '—'}
                      <span className="text-[10px] text-slate-400">%</span>
                    </p>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-3 text-center border border-slate-800">
                    <p className="text-[9px] uppercase text-slate-500 font-semibold">Drying Rate</p>
                    <p className={`text-lg font-mono font-bold flex items-center justify-center gap-0.5 ${
                      (prediction.slope_pct_per_hour ?? 0) < 0 ? 'text-orange-400' : 'text-emerald-400'
                    }`}>
                      {(prediction.slope_pct_per_hour ?? 0) < 0
                        ? <TrendingDown className="w-3.5 h-3.5" />
                        : <TrendingUp className="w-3.5 h-3.5" />}
                      {prediction.slope_pct_per_hour != null
                        ? `${Math.abs(prediction.slope_pct_per_hour).toFixed(3)}`
                        : '—'}
                    </p>
                    <p className="text-[9px] text-slate-500">%/hr</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-3 text-center border border-slate-800">
                    <p className="text-[9px] uppercase text-slate-500 font-semibold">Until Trigger</p>
                    <p className={`text-lg font-mono font-bold ${
                      prediction.urgency === 'critical' ? 'text-red-400' :
                      prediction.urgency === 'warning' ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      {prediction.predicted_hours_to_trigger != null
                        ? `${prediction.predicted_hours_to_trigger}h`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Confidence: <strong className="text-slate-400">{prediction.confidence || '—'}</strong></span>
                  {prediction.has_trend === false && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Low data
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">Unable to load irrigation prediction.</p>
            )}
          </div>

          {/* AI Soil Health Report Card */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-900/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/80">AI Feature</span>
                <h3 className="text-sm font-bold text-slate-100 -mt-0.5">Soil Health Report</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a comprehensive AI-narrated agronomic report for{' '}
              <strong className="text-slate-300">{farmName}</strong> — including metric breakdown,
              irrigation forecast, NPK analysis, and a 7-day action plan.
              Printable and exportable as PDF.
            </p>

            <div className="flex flex-wrap gap-2 text-[10px]">
              {['Executive Summary', 'Metric Breakdown', 'NPK Analysis', 'Irrigation Forecast', '7-Day Plan', 'PDF Export'].map(f => (
                <span key={f} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />{f}
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-950/50 text-sm font-bold transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              Generate AI Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
        {/* ──── END AI FEATURES ──── */}

      </div>

      {/* Soil Report Modal */}
      {showReportModal && (
        <SoilReportModal
          locationId={locId}
          locationName={farmName}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
