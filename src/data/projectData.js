// Project, Organization, Advisor, Team, and Field metadata with clearly marked placeholders
export const PROJECT_DETAILS = {
  title: 'TerraPulse: Autonomous Soil Health Monitoring System',
  shortName: 'TerraPulse OS',
  tagline: 'Precision Agriculture & Local Ground Telemetry Platform',
  version: 'v1.0.0-alpha',
  status: 'Active Prototype (Phase 1)',
  startDate: 'July 2026',
  targetCompletion: 'December 2026',
  summary: 'TerraPulse is a local-first precision agriculture platform designed for real-time monitoring and spatial visualization of critical soil health parameters. Utilizing an array of multi-depth IoT ground sensors paired with high-resolution satellite GIS mapping, the system continuously tracks volumetric moisture, soil pH, temperature, electrical conductivity, and NPK macronutrient concentrations to optimize crop yield, prevent soil degradation, and empower sustainable field management.',
  objectives: [
    {
      title: 'Continuous Soil Profiling',
      description: 'Continuous sampling of moisture (VWC) and core soil temperature at 15cm and 30cm root depths.'
    },
    {
      title: 'Nutrient & Salinity Tracking',
      description: 'Real-time monitoring of NPK macronutrients and Electrical Conductivity (EC) to prevent soil salinization.'
    },
    {
      title: 'Satellite GIS Integration',
      description: 'High-resolution parcel overlay mapping with zone-based micro-climate and soil moisture tracking.'
    },
    {
      title: 'Autonomous Local Gateway',
      description: 'Zero-cloud local operation ensuring full offline telemetry collection for remote agricultural fields.'
    }
  ],
  roadmap: [
    { phase: 'Phase 1', title: 'Local Frontend & GIS UI', status: 'Completed', date: 'August 2026' },
    { phase: 'Phase 2', title: 'Sensor Gateway & RS485 Bus', status: 'Upcoming', date: 'September 2026' },
    { phase: 'Phase 3', title: 'Local SQLite Database & Telemetry Pipeline', status: 'Planned', date: 'October 2026' },
    { phase: 'Phase 4', title: 'AI Recommendation Engine & Yield Analytics', status: 'Planned', date: 'November 2026' }
  ]
};

export const ORGANIZATION_DETAILS = {
  name: '[Organization / AgriTech Enterprise Name]',
  isPlaceholder: true,
  department: '[Department of Precision Agriculture & Environmental Systems]',
  division: '[Smart Farming & IoT Sensing Laboratory]',
  location: '[City, State / Province, Country]',
  facility: '[AgriTech Innovation Center, Building B]',
  website: '[https://organization-domain.org]',
  contactEmail: '[contact@organization-domain.org]',
  focusArea: 'Sustainable Agronomy, Edge IoT Systems & Geospatial Soil Modeling'
};

export const ADVISOR_DETAILS = {
  name: '[Dr. / Prof. Advisor Name]',
  isPlaceholder: true,
  title: '[Principal Agricultural Advisor & Research Director]',
  affiliation: '[University / Agricultural Research Institute]',
  department: '[Department of Soil Science & Agro-Ecosystems]',
  domainExpertise: [
    'Soil Chemistry & Macronutrient Dynamics',
    'Geospatial Remote Sensing in Agriculture',
    'Precision Irrigation & Water Management'
  ],
  email: '[advisor.email@institution.edu]',
  office: '[Room 402, Agricultural Sciences Complex]',
  notes: 'Providing scientific validation for sensor calibration curves, NPK optical spectroscopy thresholds, and soil health indexing algorithms.'
};

export const TEAM_MEMBERS = [
  {
    id: 'TM_001',
    name: '[Lead Engineer / Project Lead]',
    isPlaceholder: true,
    role: 'Project Lead & System Architect',
    department: 'Engineering & Systems',
    focus: 'System architecture, local telemetry runtime, integration of IoT hardware bus and frontend client.',
    contributions: ['System Design', 'Telemetry Protocol', 'Project Coordination'],
    email: '[lead.engineer@organization.org]',
    status: 'Active'
  },
  {
    id: 'TM_002',
    name: '[Agronomy Specialist]',
    isPlaceholder: true,
    role: 'Soil Scientist & Agronomy Lead',
    department: 'Agricultural Sciences',
    focus: 'Soil taxonomy, moisture characteristic curves, NPK nutrient thresholds, and agronomic baseline modeling.',
    contributions: ['Soil Modeling', 'Sensor Metric Bounds', 'Field Validation'],
    email: '[agronomy.lead@organization.org]',
    status: 'Active'
  },
  {
    id: 'TM_003',
    name: '[Frontend & GIS Engineer]',
    isPlaceholder: true,
    role: 'Frontend & Geospatial Developer',
    department: 'Software Development',
    focus: 'React UI architecture, Leaflet/Google Satellite mapping, interactive location marker HUDs, and data visualization.',
    contributions: ['React UI', 'Satellite GIS', 'Telemetry HUD'],
    email: '[frontend.dev@organization.org]',
    status: 'Active'
  },
  {
    id: 'TM_004',
    name: '[Embedded Systems Engineer]',
    isPlaceholder: true,
    role: 'IoT Hardware & Firmware Engineer',
    department: 'Embedded Electronics',
    focus: 'RS485 Modbus sensor communication, low-power microcontroller firmware, and local serial telemetry gateway.',
    contributions: ['Firmware Development', 'RS485 Modbus', 'Power Optimization'],
    email: '[embedded.dev@organization.org]',
    status: 'Active'
  },
  {
    id: 'TM_005',
    name: '[Data & Machine Learning Analyst]',
    isPlaceholder: true,
    role: 'Data Analyst & ML Specialist',
    department: 'Data Science',
    focus: 'Soil health score algorithms, historical moisture trend analysis, and predictive irrigation models.',
    contributions: ['Soil Health Index', 'Statistical Analysis', 'AI Models'],
    email: '[data.analyst@organization.org]',
    status: 'Active'
  }
];

export const FIELD_DETAILS = {
  primarySite: {
    id: 'LOC_001',
    code: 'LOC_001',
    name: 'Field Alpha (North Parcel)',
    isPlaceholder: false,
    coordinates: '36.7783° N, 119.4179° W',
    elevation: '112 m ASL',
    coverageArea: '48.5 Hectares (120 Acres)',
    soilClassification: 'Loamy Silt (Type II)',
    currentCrop: 'Hybrid Maize / Soybean Rotation',
    topography: 'Gentle Slope (< 2% gradient)',
    sensorDeployment: {
      totalNodes: 14,
      nodeType: 'Multi-Depth 5-in-1 Soil Probes (Moisture, Temp, EC, pH, NPK)',
      depthLevels: ['15 cm (Root Zone)', '30 cm (Sub-Surface)', '45 cm (Deep Horizon)'],
      samplingInterval: '15 Minutes (Continuous Local Cache)',
      transmissionProtocol: 'RS485 Modbus RTU / Local Telemetry Bus'
    },
    soilBaseline: {
      targetMoistureRange: '24% - 32% VWC',
      targetPH: '6.5 - 7.2',
      ecThreshold: '< 2.0 dS/m',
      organicMatter: '3.8% SOM'
    }
  },
  secondarySite: {
    id: 'LOC_002',
    name: '[Field Beta - South Parcel (Expansion)]',
    isPlaceholder: true,
    status: 'Planned for Phase 2 Deployment',
    estimatedSensors: 12,
    plannedCrop: '[Winter Wheat / Cover Crop]'
  }
};
