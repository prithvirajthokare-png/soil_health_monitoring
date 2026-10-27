/**
 * TerraPulse — SparkFun micro:climate Kit Frontend API Adapter
 * Hardware: SparkFun micro:climate Kit for micro:bit (SKU: KIT-16274)
 * Controller: SparkFun weather:bit board with compatible BBC micro:bit
 *
 * This adapter prepares the frontend contract for tomorrow's FastAPI backend connection.
 * It handles all connection states gracefully:
 * - AWAITING_CONNECTION: Backend endpoint not yet integrated
 * - CONNECTED: Valid recent readings reporting
 * - OFFLINE: Data source unreachable or reporting stopped
 * - STALE: Last reading exceeds freshness threshold
 * - PARTIAL: Some sensors reporting while others are unavailable
 * - ERROR: Request or parsing failure
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Compass cardinal directions mapping (16-point and 8-point)
export const COMPASS_DIRECTIONS = [
  { label: 'N', min: 337.5, max: 360 },
  { label: 'N', min: 0, max: 22.5 },
  { label: 'NE', min: 22.5, max: 67.5 },
  { label: 'E', min: 67.5, max: 112.5 },
  { label: 'SE', min: 112.5, max: 157.5 },
  { label: 'S', min: 157.5, max: 202.5 },
  { label: 'SW', min: 202.5, max: 247.5 },
  { label: 'W', min: 247.5, max: 292.5 },
  { label: 'NW', min: 292.5, max: 337.5 }
];

export function degreesToCardinal(degrees) {
  if (degrees == null || isNaN(degrees)) return null;
  const normalized = ((degrees % 360) + 360) % 360;
  for (const dir of COMPASS_DIRECTIONS) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.label;
    }
  }
  return 'N';
}

/**
 * Connection states supported by the frontend
 */
export const KIT_CONNECTION_STATES = {
  AWAITING_CONNECTION: 'awaiting_connection',
  CONNECTED: 'connected',
  OFFLINE: 'offline',
  STALE: 'stale',
  PARTIAL: 'partial',
  ERROR: 'error'
};

/**
 * Fetch latest Microclimate Kit environmental measurements for a given farm/location.
 * Safely handles missing backend endpoints without breaking the dashboard.
 */
export async function fetchMicroclimateLatest(locationId = 'LOC_001') {
  const url = `${API_BASE_URL}/locations/${locationId}/microclimate/latest`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (res.status === 404 || res.status === 501) {
      // Backend route pending integration tomorrow
      return {
        state: KIT_CONNECTION_STATES.AWAITING_CONNECTION,
        message: 'Microclimate Kit connection pending. Live readings will appear after hardware integration.',
        locationId,
        hardware: {
          product: 'SparkFun micro:climate Kit for micro:bit',
          sku: 'KIT-16274',
          controller: 'SparkFun weather:bit with BBC micro:bit'
        },
        readings: null,
        lastUpdated: null
      };
    }

    if (!res.ok) {
      return {
        state: KIT_CONNECTION_STATES.ERROR,
        message: `Weather service returned HTTP ${res.status}`,
        locationId,
        readings: null,
        lastUpdated: null
      };
    }

    const data = await res.json();
    return formatMicroclimateResponse(data, locationId);
  } catch (err) {
    // Network / backend unreachable
    return {
      state: KIT_CONNECTION_STATES.AWAITING_CONNECTION,
      message: 'Microclimate Kit connection pending. Live readings will appear after hardware integration.',
      locationId,
      hardware: {
        product: 'SparkFun micro:climate Kit for micro:bit',
        sku: 'KIT-16274',
        controller: 'SparkFun weather:bit with BBC micro:bit'
      },
      readings: null,
      lastUpdated: null
    };
  }
}

/**
 * Fetch historical measurements for charts (24h, 7d, 30d)
 */
export async function fetchMicroclimateHistory(locationId = 'LOC_001', range = '24h') {
  const url = `${API_BASE_URL}/locations/${locationId}/microclimate/history?range=${range}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      return {
        range,
        locationId,
        data: []
      };
    }

    const data = await res.json();
    return {
      range,
      locationId,
      data: Array.isArray(data) ? data : (data.readings || [])
    };
  } catch (err) {
    return {
      range,
      locationId,
      data: []
    };
  }
}

/**
 * Standardize backend microclimate response payload
 */
export function formatMicroclimateResponse(raw, locationId) {
  if (!raw) {
    return {
      state: KIT_CONNECTION_STATES.AWAITING_CONNECTION,
      message: 'Microclimate Kit connection pending. Live readings will appear after hardware integration.',
      locationId,
      readings: null,
      lastUpdated: null
    };
  }

  const readings = raw.readings || raw;
  const lastUpdated = raw.timestamp || readings.timestamp || null;

  // Determine freshness
  let state = KIT_CONNECTION_STATES.CONNECTED;
  if (lastUpdated) {
    const ageSeconds = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
    if (ageSeconds > 86400) {
      state = KIT_CONNECTION_STATES.OFFLINE;
    } else if (ageSeconds > 3600) {
      state = KIT_CONNECTION_STATES.STALE;
    }
  }

  // Check partial
  const supportedKeys = ['air_temperature_c', 'relative_humidity_pct', 'barometric_pressure_hpa', 'wind_speed_ms', 'rainfall_mm'];
  const presentCount = supportedKeys.filter(k => readings[k] !== undefined && readings[k] !== null).length;
  if (presentCount > 0 && presentCount < supportedKeys.length) {
    state = KIT_CONNECTION_STATES.PARTIAL;
  }

  return {
    state,
    message: raw.message || 'Microclimate Kit reporting normally.',
    locationId,
    hardware: {
      product: 'SparkFun micro:climate Kit for micro:bit',
      sku: 'KIT-16274',
      controller: 'SparkFun weather:bit with BBC micro:bit'
    },
    lastUpdated,
    readings: {
      air_temperature_c: readings.air_temperature_c ?? null,
      relative_humidity_pct: readings.relative_humidity_pct ?? null,
      barometric_pressure_hpa: readings.barometric_pressure_hpa ?? null,
      rainfall_mm: readings.rainfall_mm ?? null,
      rainfall_interval_mm: readings.rainfall_interval_mm ?? null,
      rainfall_cumulative_mm: readings.rainfall_cumulative_mm ?? readings.rainfall_mm ?? null,
      wind_speed_ms: readings.wind_speed_ms ?? null,
      wind_direction_deg: readings.wind_direction_deg ?? null,
      wind_direction_cardinal: readings.wind_direction_cardinal || degreesToCardinal(readings.wind_direction_deg),
      light_intensity: readings.light_intensity ?? null,
      light_unit: readings.light_unit || 'raw (0-1023)',
      kit_soil_moisture: readings.kit_soil_moisture ?? null,
      kit_soil_moisture_unit: readings.kit_soil_moisture_unit || 'ADC (0-1023)',
      probe_temperature_c: readings.probe_temperature_c ?? null,
      probe_label: readings.probe_label || 'External Temperature Probe'
    }
  };
}

/**
 * Isolated Demonstration Fixture
 * Used ONLY when user explicitly toggles Demo Preview to evaluate UI layout & charts.
 * Never passed off as live readings.
 */
export function getIsolatedDemoMicroclimate(locationId = 'LOC_001', range = '24h') {
  const now = Date.now();
  const points = range === '24h' ? 24 : (range === '7d' ? 28 : 30);
  const stepMs = (range === '24h' ? 3600000 : (range === '7d' ? 3600000 * 6 : 86400000));

  const history = [];
  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * stepMs).toISOString();
    const cycle = (points - i) / 6;
    history.push({
      timestamp: t,
      air_temperature_c: +(24 + 4 * Math.sin(cycle) + Math.sin(cycle * 2)).toFixed(1),
      relative_humidity_pct: +(65 + 12 * Math.cos(cycle)).toFixed(1),
      barometric_pressure_hpa: +(1012 + 2 * Math.sin(cycle * 0.5)).toFixed(1),
      wind_speed_ms: +(3.2 + 1.8 * Math.abs(Math.sin(cycle * 1.5))).toFixed(1),
      wind_direction_deg: Math.round((180 + 90 * Math.sin(cycle)) % 360),
      rainfall_mm: +(Math.max(0, 1.2 * Math.sin(cycle - 1))).toFixed(1),
      kit_soil_moisture: Math.round(520 + 80 * Math.cos(cycle * 0.7)),
      probe_temperature_c: +(22.5 + 2 * Math.sin(cycle - 0.5)).toFixed(1),
      light_intensity: Math.max(0, Math.round(750 * Math.sin(cycle)))
    });
  }

  const latest = history[history.length - 1];

  return {
    state: KIT_CONNECTION_STATES.CONNECTED,
    isDemo: true,
    message: 'Demo / Simulation Data (Hardware integration pending tomorrow)',
    locationId,
    hardware: {
      product: 'SparkFun micro:climate Kit for micro:bit',
      sku: 'KIT-16274',
      controller: 'SparkFun weather:bit with BBC micro:bit'
    },
    lastUpdated: latest.timestamp,
    readings: {
      ...latest,
      wind_direction_cardinal: degreesToCardinal(latest.wind_direction_deg),
      light_unit: 'raw (0-1023)',
      kit_soil_moisture_unit: 'ADC (0-1023)',
      probe_label: 'External Temperature Probe'
    },
    history
  };
}
