import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Gauge,
  Sun,
  CloudRain,
  Sprout,
  Activity,
  RefreshCw,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  fetchMicroclimateLatest,
  fetchMicroclimateHistory,
  getIsolatedDemoMicroclimate,
  KIT_CONNECTION_STATES,
  degreesToCardinal
} from '../services/microclimateApi';

export default function MicroclimateView({
  locationData,
  locationsList = [],
  selectedLocationId,
  onSelectLocation,
  isAdmin = false,
  onBackToMap
}) {
  const locId = locationData?.id || 'LOC_001';
  const farmName = locationData?.farmerName ? `${locationData.farmerName} Farm` : (locationData?.name || locId);

  const [kitState, setKitState] = useState(KIT_CONNECTION_STATES.AWAITING_CONNECTION);
  const [kitData, setKitData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useDemoPreview, setUseDemoPreview] = useState(false);

  const loadData = useCallback(async () => {
    if (useDemoPreview) {
      const demo = getIsolatedDemoMicroclimate(locId, selectedRange);
      setKitState(demo.state);
      setKitData(demo);
      setHistoryData(demo.history || []);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    try {
      const latest = await fetchMicroclimateLatest(locId);
      setKitState(latest.state);
      setKitData(latest);

      if (latest.state === KIT_CONNECTION_STATES.CONNECTED || latest.state === KIT_CONNECTION_STATES.PARTIAL) {
        const hist = await fetchMicroclimateHistory(locId, selectedRange);
        setHistoryData(hist.data || []);
      } else {
        setHistoryData([]);
      }
    } catch (e) {
      setKitState(KIT_CONNECTION_STATES.ERROR);
      setKitData(null);
      setHistoryData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [locId, selectedRange, useDemoPreview]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const readings = kitData?.readings;
  const isPending = kitState === KIT_CONNECTION_STATES.AWAITING_CONNECTION;

  // Status Badge Rendering
  const renderStatusBadge = () => {
    if (useDemoPreview) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <Sparkles className="w-3.5 h-3.5" />
          DEMO PREVIEW (HARDWARE CONNECTING TOMORROW)
        </span>
      );
    }

    switch (kitState) {
      case KIT_CONNECTION_STATES.CONNECTED:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CONNECTED & REPORTING
          </span>
        );
      case KIT_CONNECTION_STATES.PARTIAL:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <AlertCircle className="w-3.5 h-3.5" />
            PARTIAL SENSOR DATA
          </span>
        );
      case KIT_CONNECTION_STATES.STALE:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" />
            STALE TELEMETRY
          </span>
        );
      case KIT_CONNECTION_STATES.OFFLINE:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertCircle className="w-3.5 h-3.5" />
            OFFLINE
          </span>
        );
      case KIT_CONNECTION_STATES.ERROR:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertCircle className="w-3.5 h-3.5" />
            COMMUNICATION ERROR
          </span>
        );
      case KIT_CONNECTION_STATES.AWAITING_CONNECTION:
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <Clock className="w-3.5 h-3.5" />
            HARDWARE INTEGRATION PENDING
          </span>
        );
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">

      {/* Top Breadcrumb & Architecture Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Microclimate Module
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">SparkFun micro:climate Kit (KIT-16274)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-amber-400 shrink-0" />
            Microclimate Kit
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time on-field weather & environmental telemetry for <span className="text-emerald-400 font-semibold">{farmName}</span> ({locId}).
          </p>
        </div>

        {/* Controls & Connection Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Admin Farm Selector (Populated from real available locations) */}
          {isAdmin && locationsList.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label htmlFor="admin-microclimate-farm-select" className="text-slate-400 font-semibold uppercase text-[10px] hidden sm:inline">Farm:</label>
              <select
                id="admin-microclimate-farm-select"
                value={locId}
                onChange={(e) => onSelectLocation?.(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
              >
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-900 text-slate-200">
                    {loc.farmerName ? `${loc.farmerName} Farm` : (loc.name || loc.id)} ({loc.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {renderStatusBadge()}

          <button
            onClick={() => setUseDemoPreview(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              useDemoPreview
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle simulated fixture preview ahead of hardware hookup"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {useDemoPreview ? 'Exit Preview' : 'Demo UI Preview'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            title="Refresh Microclimate Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Distinction Notice (Soil Sensor vs Weather Kit) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-300">Data Architecture Distinction: </span>
          TerraPulse maintains two separate data pipelines. The <span className="text-emerald-400 font-medium">Soil Health Dashboard</span> displays sub-surface NPK, moisture & pH telemetry from the deployed LoRa sensor array. This <span className="text-amber-400 font-medium">Microclimate Kit</span> section manages above-ground environmental observations from the SparkFun weather:bit weather station.
        </div>
      </div>

      {/* Awaiting Connection Notice when in production mode without backend */}
      {isPending && !useDemoPreview && (
        <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
            <CloudSun className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            Microclimate Kit connection pending
          </h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Live readings will appear after hardware integration tomorrow. The frontend adapters, measurement units, and charting interfaces are prepared and ready for incoming weather:bit telemetry.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setUseDemoPreview(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-900/30 inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Enable Demonstration Preview to View Layout & Charts
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards Grid (9 Environmental Parameters) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Environmental Measurements (SparkFun weather:bit)
          </h2>
          {kitData?.lastUpdated && (
            <span className="text-[11px] text-slate-500 font-mono">
              Last reading: {new Date(kitData.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {/* A. Air Temperature */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Air Temperature</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.air_temperature_c != null ? `${readings.air_temperature_c}°C` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">weather:bit BME280 air temp sensor</p>
            </div>
          </div>

          {/* B. Relative Humidity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Relative Humidity</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.relative_humidity_pct != null ? `${readings.relative_humidity_pct}% RH` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ambient relative atmospheric humidity</p>
            </div>
          </div>

          {/* C. Barometric Pressure */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Barometric Pressure</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.barometric_pressure_hpa != null ? `${readings.barometric_pressure_hpa} hPa` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Atmospheric pressure at elevation</p>
            </div>
          </div>

          {/* D. Rainfall */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rainfall</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.rainfall_mm != null ? `${readings.rainfall_mm} mm` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {readings?.rainfall_interval_mm != null
                  ? `Interval: ${readings.rainfall_interval_mm} mm • Cum: ${readings.rainfall_cumulative_mm} mm`
                  : 'Weather meter tipping bucket gauge'}
              </p>
            </div>
          </div>

          {/* E. Wind Speed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Wind Speed</span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.wind_speed_ms != null ? `${readings.wind_speed_ms} m/s` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Anemometer pulse cup assembly</p>
            </div>
          </div>

          {/* F. Wind Direction & Compass */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Wind Direction</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-slate-100">
                  {readings?.wind_direction_deg != null
                    ? `${readings.wind_direction_deg}° (${readings.wind_direction_cardinal || degreesToCardinal(readings.wind_direction_deg)})`
                    : '—'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Weather vane potentiometer</p>
              </div>

              {/* Compass Widget */}
              {readings?.wind_direction_deg != null && (
                <div className="relative w-12 h-12 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
                  <span className="absolute top-0.5 text-[8px] text-slate-400 font-bold">N</span>
                  <div
                    className="w-1 h-7 bg-amber-400 rounded-full transition-transform duration-700"
                    style={{ transform: `rotate(${readings.wind_direction_deg}deg)` }}
                  >
                    <div className="w-1 h-3.5 bg-rose-500 rounded-t-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* G. Light Intensity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Light Intensity</span>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Sun className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.light_intensity != null ? `${readings.light_intensity}` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Scale: {readings?.light_unit || 'raw ADC (0-1023)'}</p>
            </div>
          </div>

          {/* H. Kit Soil Moisture (Separate from LoRa sensor) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Kit Soil Moisture</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sprout className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.kit_soil_moisture != null ? `${readings.kit_soil_moisture}` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                SparkFun probe ({readings?.kit_soil_moisture_unit || 'ADC 0-1023'}) • Separate from LoRa hub
              </p>
            </div>
          </div>

          {/* I. Separate Temperature Probe (Probe / Soil Temperature) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {readings?.probe_label || 'External Temp Probe'}
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-100">
                {readings?.probe_temperature_c != null ? `${readings.probe_temperature_c}°C` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Waterproof auxiliary probe (soil/canopy)</p>
            </div>
          </div>

        </div>
      </div>

      {/* Historical Weather Trends Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">

        {/* Section Header with Time-Range Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Historical Environmental Observations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trends captured by the SparkFun micro:climate kit over time.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {['24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedRange === range
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '24h' ? '24 Hours' : (range === '7d' ? '7 Days' : '30 Days')}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 1: Temperature & Humidity Over Time */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider">Air Temperature & Humidity</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-rose-400">
                  <span className="w-2.5 h-0.5 bg-rose-400 rounded"></span> Temp (°C)
                </span>
                <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400 rounded"></span> Humidity (% RH)
                </span>
              </div>
            </div>

            <LineChart
              data={historyData}
              lines={[
                { key: 'air_temperature_c', color: '#f43f5e', label: '°C' },
                { key: 'relative_humidity_pct', color: '#06b6d4', label: '%' }
              ]}
              emptyMessage={isPending && !useDemoPreview ? "Telemetry awaiting hardware connection tomorrow." : "No temperature/humidity history available."}
            />
          </div>

          {/* Chart 2: Rainfall Over Time */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider">Precipitation / Rainfall (mm)</span>
              <span className="text-[11px] text-blue-400 font-mono">Accumulated</span>
            </div>

            <BarChart
              data={historyData}
              valueKey="rainfall_mm"
              color="#3b82f6"
              unit="mm"
              emptyMessage={isPending && !useDemoPreview ? "Precipitation logging will start with hardware integration." : "No rainfall recorded in selected timeframe."}
            />
          </div>

          {/* Chart 3: Wind Speed Over Time */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider">Wind Speed (m/s)</span>
              <span className="text-[11px] text-teal-400 font-mono">Anemometer</span>
            </div>

            <LineChart
              data={historyData}
              lines={[
                { key: 'wind_speed_ms', color: '#14b8a6', label: 'm/s' }
              ]}
              emptyMessage={isPending && !useDemoPreview ? "Wind speed records pending hardware integration." : "No wind speed records found."}
            />
          </div>

          {/* Chart 4: Kit Soil Moisture Over Time */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider">Kit Soil Moisture (ADC scale)</span>
              <span className="text-[11px] text-emerald-400 font-mono">Auxiliary Probe</span>
            </div>

            <LineChart
              data={historyData}
              lines={[
                { key: 'kit_soil_moisture', color: '#10b981', label: 'ADC' }
              ]}
              emptyMessage={isPending && !useDemoPreview ? "Kit soil moisture will display after hardware hookup." : "No soil moisture history found for kit probe."}
            />
          </div>

        </div>
      </div>

      {/* Hardware Specifications Footer Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-slate-500 uppercase font-bold block text-[10px] mb-1">Target Farm & Node</span>
          <span className="text-slate-200 font-semibold">{farmName}</span>
          <span className="text-slate-400 block font-mono text-[11px]">{locId} &bull; Sensor Node: {locationData?.sensor_id || locationData?.sensorId || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold block text-[10px] mb-1">Kit Identification</span>
          <span className="text-slate-200 font-semibold">SparkFun micro:climate Kit</span>
          <span className="text-slate-400 block font-mono text-[11px]">SKU: KIT-16274</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold block text-[10px] mb-1">Controller & Ingestion</span>
          <span className="text-slate-200 font-semibold">weather:bit Carrier Board</span>
          <span className="text-slate-400 block text-[11px]">BBC micro:bit telemetry adapter</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold block text-[10px] mb-1">Integrated Weather Meter</span>
          <span className="text-slate-200 font-semibold">Wind Speed, Direction & Rain Gauge</span>
          <span className="text-slate-400 block text-[11px]">BME280 barometric & temp/humidity</span>
        </div>
      </div>

    </div>
  );
}

/**
 * Responsive Pure-SVG Line Chart Component
 * Gracefully handles empty, invalid, and sparse datasets without crashing.
 */
function LineChart({ data = [], lines = [], emptyMessage }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs text-center p-4">
        <Radio className="w-5 h-5 text-slate-600 mb-1.5" />
        {emptyMessage || 'No readings to display.'}
      </div>
    );
  }

  // Dimensions
  const width = 500;
  const height = 160;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  // Calculate scales across lines
  let minVal = Infinity;
  let maxVal = -Infinity;

  lines.forEach(line => {
    data.forEach(d => {
      const v = d[line.key];
      if (v != null && !isNaN(v)) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    });
  });

  if (minVal === Infinity || maxVal === -Infinity) {
    minVal = 0;
    maxVal = 100;
  } else if (minVal === maxVal) {
    minVal = Math.max(0, minVal - 5);
    maxVal = maxVal + 5;
  }

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (idx) => padding.left + (idx / Math.max(1, data.length - 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  return (
    <div className="w-full h-44 overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = padding.top + chartH * pct;
          const val = (maxVal - pct * (maxVal - minVal)).toFixed(1);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {val}
              </text>
            </g>
          );
        })}

        {/* Polylines for each line config */}
        {lines.map(line => {
          const points = data
            .map((d, idx) => {
              const val = d[line.key];
              if (val == null || isNaN(val)) return null;
              return `${getX(idx)},${getY(val)}`;
            })
            .filter(Boolean)
            .join(' ');

          if (!points) return null;

          return (
            <g key={line.key}>
              <polyline
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {data.map((d, idx) => {
                const val = d[line.key];
                if (val == null || isNaN(val)) return null;
                return (
                  <circle
                    key={idx}
                    cx={getX(idx)}
                    cy={getY(val)}
                    r="3"
                    fill={line.color}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Timestamps on X axis */}
        {data.length > 0 && (
          <>
            <text x={padding.left} y={height - 6} fontSize="9" fill="#64748b" fontFamily="monospace">
              {new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
            <text x={width - padding.right} y={height - 6} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
              {new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Responsive Pure-SVG Bar Chart Component
 */
function BarChart({ data = [], valueKey = 'rainfall_mm', color = '#3b82f6', unit = 'mm', emptyMessage }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs text-center p-4">
        <Radio className="w-5 h-5 text-slate-600 mb-1.5" />
        {emptyMessage || 'No readings to display.'}
      </div>
    );
  }

  const width = 500;
  const height = 160;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  let maxVal = 0;
  data.forEach(d => {
    const v = d[valueKey];
    if (v != null && !isNaN(v) && v > maxVal) maxVal = v;
  });

  if (maxVal === 0) maxVal = 5;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barWidth = Math.max(3, (chartW / data.length) - 3);

  return (
    <div className="w-full h-44 overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = padding.top + chartH * pct;
          const val = (maxVal - pct * maxVal).toFixed(1);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const v = d[valueKey] || 0;
          const barH = (v / maxVal) * chartH;
          const x = padding.left + (idx * (chartW / data.length)) + 1.5;
          const y = padding.top + chartH - barH;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barH)}
              fill={color}
              rx="2"
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          );
        })}

        {/* Timestamps */}
        {data.length > 0 && (
          <>
            <text x={padding.left} y={height - 6} fontSize="9" fill="#64748b" fontFamily="monospace">
              {new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
            <text x={width - padding.right} y={height - 6} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
              {new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
