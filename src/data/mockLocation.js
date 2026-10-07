// Baseline Demo Metadata and Telemetry for Idea Factory (LOC_001)
export const LOCATION_LOC_001 = {
  id: 'LOC_001',
  code: 'LOC_001',
  name: 'Idea Factory',
  crop: 'tomato',
  soilType: 'Loamy Silt',
  coordinates: {
    lat: 13.0094631,
    lng: 74.7952437,
    formatted: '13°00\'34.1"N 74°47\'42.9"E'
  },
  elevation: 'Unknown / To be provided',
  coverageArea: '119.8 Acres',
  healthScore: 100,
  healthStatus: 'Optimal'
};

export const DEMO_LOC_001_READING = {
  id: 1,
  location_id: 'LOC_001',
  sensor_id: 'SN_001',
  timestamp: new Date().toISOString(),
  moisture_pct: 27.4,
  ph: 6.78,
  temperature_c: 21.5,
  ec_ds_m: 1.18,
  nitrogen_mg_kg: 52.5,
  phosphorus_mg_kg: 27.5,
  potassium_mg_kg: 104.0,
  battery_pct: 98.5
};

export const DEMO_LOC_001_EVALUATION = {
  location_id: 'LOC_001',
  crop_type: 'tomato',
  growth_stage: 1,
  health_score: 100,
  health_status: 'Optimal',
  recommendations: [
    'All soil health metrics for Idea Factory are within optimal agronomic targets.'
  ],
  stage_targets: {
    plant_type: 'tomato',
    growth_stage: 1,
    stage_name: 'vegetative',
    n_target_mg_kg: 53.8,
    p_target_mg_kg: 28.0,
    k_target_mg_kg: 103.0,
    irrigation_trigger_pct: 20.0,
    ph_min: 5.5,
    ph_max: 7.5,
    temp_min_c: 15.0,
    temp_max_c: 30.0,
    ece_threshold_ds_m: 2.5
  }
};

export const SYSTEM_INFO = {
  version: 'v1.0.0',
  mode: 'Local Prototype',
  firmwareSync: 'FastAPI Backend Stream',
  gatewayStatus: 'Ready'
};
