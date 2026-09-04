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
    return null;
  }
  return response.json();
}

export async function fetchEvaluation(locationId = 'LOC_001') {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}/evaluation`);
  if (!response.ok) {
    return null;
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
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch (e) {
        // Ignore json parse error on non-json error responses
      }
      throw new Error(`Export failed (${response.status}): ${errorDetail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = `${locationId}_telemetry_${range}.csv`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
    return true;
  } catch (err) {
    console.error('[API Service] Error downloading CSV:', err);
    throw err;
  }
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
    console.warn('[API Service] Backend offline or unavailable:', err.message);
    return {
      location: null,
      latest: null,
      evaluation: null,
      isLive: false,
      error: err.message
    };
  }
}
