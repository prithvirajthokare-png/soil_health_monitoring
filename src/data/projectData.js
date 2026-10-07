// Project, Organization, Advisor, Team, and Field metadata
export const PROJECT_DETAILS = {
  title: 'TerraPulse: Autonomous Soil Health Monitoring System',
  shortName: 'TerraPulse OS',
  tagline: 'Precision Agriculture & Local Ground Telemetry Platform',
  version: 'v1.0.0',
  status: 'Active Prototype',
  startDate: 'July 2026',
  targetCompletion: 'To be provided',
  summary: 'TerraPulse is a precision agriculture platform designed for real-time monitoring and spatial visualization of critical soil health parameters. Utilizing an array of IoT ground sensors paired with satellite GIS mapping, the system tracks volumetric moisture, soil pH, temperature, electrical conductivity, and NPK macronutrient concentrations to evaluate crop-specific soil health and empower sustainable field management.',
  objectives: [
    {
      title: 'Continuous Soil Profiling',
      description: 'Continuous sampling of moisture (VWC) and core soil temperature at root depths.'
    },
    {
      title: 'Nutrient & Salinity Tracking',
      description: 'Real-time monitoring of NPK macronutrients and Electrical Conductivity (EC) to prevent soil salinization.'
    },
    {
      title: 'Satellite GIS Integration',
      description: 'High-resolution parcel overlay mapping with zone-based micro-climate and soil health tracking.'
    },
    {
      title: 'Autonomous Local Gateway',
      description: 'Zero-cloud local operation ensuring full offline telemetry collection for agricultural fields.'
    }
  ]
};

export const ORGANIZATION_DETAILS = {
  name: 'IDEA Factory, National Institute of Technology Karnataka, Surathkal',
  department: 'Centre for Interdisciplinary Study / Transdisciplinary R&D',
  division: 'IDEA Factory',
  location: 'National Institute of Technology Karnataka, Surathkal, Srinivasnagar, Mangaluru, Karnataka – 575025, India',
  contactEmail: 'info@nitk.edu.in',
  reference: 'ORG_2026'
};

export const ADVISOR_DETAILS = {
  name: 'Dr. Pruthviraj Umesh',
  title: 'Associate Professor',
  additionalRole: 'Professor-in-Charge, Transdisciplinary R&D / IDEA Factory',
  affiliation: 'National Institute of Technology Karnataka, Surathkal (NITK)',
  department: 'Department of Water Resources & Ocean Engineering',
  email: 'pruthviu@nitk.edu.in',
  office: 'NITK Surathkal, Srinivasnagar, Mangaluru – 575025, Karnataka, India',
  reference: 'ADV_2026'
};

// Project Team / Engineering Roster: 2 positions
export const TEAM_MEMBERS = [
  {
    id: 'TM_001',
    name: 'Prithviraj Thokare',
    department: 'Civil Engineering',
    role: '—',
    status: 'Active'
  },
  {
    id: 'TM_002',
    name: 'Afrah Hajira',
    department: 'Electrical & Electronics Engineering (EEE)',
    role: '—',
    status: 'Active'
  }
];

export const FIELD_DETAILS = {
  primarySite: {
    id: 'LOC_001',
    code: 'LOC_001',
    name: 'Idea Factory',
    isPlaceholder: false,
    coordinates: '13.0094631° N, 74.7952437° E',
    elevation: 'Unknown / To be provided',
    coverageArea: '119.8 Acres',
    soilClassification: 'Loamy Silt',
    currentCrop: 'Tomato',
    topography: 'Unknown / To be provided',
    sensorDeployment: {
      totalNodes: 1,
      nodeType: 'SN_001 Soil Telemetry Probe',
      depthLevels: ['Standard Root Zone Probe'],
      samplingInterval: '30 Minutes (Continuous Stream)',
      transmissionProtocol: 'Local IoT Telemetry Bus'
    },
    soilBaseline: {
      targetMoistureRange: '20% - 45% VWC',
      targetPH: '5.5 - 7.5',
      ecThreshold: '< 2.5 dS/m',
      organicMatter: 'Unknown / To be provided'
    }
  },
  secondarySite: {
    id: 'LOC_002',
    name: 'Test Location',
    isPlaceholder: true,
    coordinates: '20.1929232° N, 76.5352501° E',
    status: 'Test Deployment',
    estimatedSensors: 1,
    plannedCrop: 'Unknown / To be provided'
  }
};
