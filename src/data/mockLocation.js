// Metadata and soil telemetry placeholder for LOC_001
export const LOCATION_LOC_001 = {
  id: 'LOC_001',
  code: 'LOC_001',
  name: 'Field Alpha (North Parcel)',
  crop: 'Hybrid Maize / Soybean',
  soilType: 'Loamy Silt (Type II)',
  coordinates: {
    lat: 36.7783,
    lng: -119.4179,
    formatted: '36°46\'41.9"N 119°25\'04.4"W'
  },
  elevation: '112 m ASL',
  coverageArea: '48.5 Hectares',
  healthScore: 86, // out of 100
  healthStatus: 'Optimal',
  lastUpdated: 'Just now (Simulated Local)',
  sensorCount: 14,
  activeNodes: 14,
  metrics: {
    moisture: {
      value: 27.4,
      unit: '%',
      status: 'optimal',
      label: 'Volumetric Water Content',
      range: '24% - 32% optimal'
    },
    ph: {
      value: 6.7,
      unit: 'pH',
      status: 'optimal',
      label: 'Soil Acidity / Alkalinity',
      range: '6.5 - 7.2 optimal'
    },
    temperature: {
      value: 21.5,
      unit: '°C',
      status: 'normal',
      label: 'Soil Core Temp (15cm)',
      range: '18°C - 24°C'
    },
    ec: {
      value: 1.18,
      unit: 'dS/m',
      status: 'optimal',
      label: 'Electrical Conductivity (Salinity)',
      range: '0.8 - 1.6 dS/m'
    },
    organicMatter: {
      value: 3.8,
      unit: '%',
      status: 'high',
      label: 'Organic Matter (SOM)',
      range: '> 3.0% target'
    },
    npk: {
      nitrogen: { value: 42, unit: 'mg/kg', status: 'optimal', label: 'Nitrogen (N)' },
      phosphorus: { value: 18, unit: 'mg/kg', status: 'optimal', label: 'Phosphorus (P)' },
      potassium: { value: 168, unit: 'mg/kg', status: 'optimal', label: 'Potassium (K)' }
    }
  },
  sensorZones: [
    { zone: 'Zone A (Crest)', status: 'Active', moisture: '26.8%', temp: '22.1°C' },
    { zone: 'Zone B (Center)', status: 'Active', moisture: '28.2%', temp: '21.4°C' },
    { zone: 'Zone C (Basin)', status: 'Active', moisture: '27.1%', temp: '21.0°C' }
  ]
};

export const SYSTEM_INFO = {
  version: 'v1.0.0-alpha',
  mode: 'Local Prototype',
  firmwareSync: 'Offline Standalone',
  gatewayStatus: 'Ready'
};
