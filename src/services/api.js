const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function fetchLocationById(locationId = 'LOC_001') {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch location ${locationId}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLatestReading(locationId = 'LOC_001') {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest reading for ${locationId}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEvaluation(locationId = 'LOC_001') {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}/evaluation`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evaluation for ${locationId}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAllLocations() {
  const response = await fetch(`${API_BASE_URL}/locations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.statusText}`);
  }
  return response.json();
}

export function getExportDataUrl(locationId = 'LOC_001', range = '1week') {
  return `${API_BASE_URL}/locations/${locationId}/export?range=${range}`;
}

export async function downloadHistoricalDataCsv(locationId = 'LOC_001', range = '1week') {
  const url = getExportDataUrl(locationId, range);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download historical telemetry (${range}): ${response.statusText}`);
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${locationId}_telemetry_${range}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function fetchFullLocationState(locationId = 'LOC_001') {
  try {
    const [location, latest, evaluation] = await Promise.all([
      fetchLocationById(locationId),
      fetchLatestReading(locationId).catch(() => null),
      fetchEvaluation(locationId).catch(() => null)
    ]);
    return {
      location,
      latest,
      evaluation,
      isLive: true,
      error: null
    };
  } catch (err) {
    console.error('[API Service] Error fetching location state:', err);
    return {
      location: null,
      latest: null,
      evaluation: null,
      isLive: false,
      error: err.message
    };
  }
}
