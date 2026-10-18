const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Token Management
export function getStoredToken() {
  try {
    return localStorage.getItem('terrapulse_auth_token');
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem('terrapulse_auth_token', token);
    } else {
      localStorage.removeItem('terrapulse_auth_token');
    }
  } catch (e) {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('terrapulse_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem('terrapulse_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('terrapulse_auth_user');
    }
  } catch (e) {}
}

export function getAuthHeaders() {
  const token = getStoredToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------- AUTHENTICATION APIS ----------------

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    let errorMsg = 'Login failed';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  setStoredToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    let errorMsg = 'Registration failed';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  setStoredToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function fetchCurrentUserProfile() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        setStoredToken(null);
        setStoredUser(null);
      }
      return null;
    }
    const user = await response.json();
    setStoredUser(user);
    return user;
  } catch (e) {
    return null;
  }
}

export function logoutUser() {
  setStoredToken(null);
  setStoredUser(null);
}

// ---------------- USER MANAGEMENT APIS (ADMIN ONLY) ----------------

export async function fetchAllUsers() {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
}

export async function createNewUser(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    let errorMsg = 'Failed to create user';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function updateUser(userId, updates) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update user';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function deleteUser(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    let errorMsg = 'Failed to delete user';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return true;
}

export async function assignFarmToUser(userId, locationIds, roleOnFarm = 'owner') {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/farms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ location_ids: locationIds, role_on_farm: roleOnFarm })
  });
  if (!response.ok) {
    throw new Error(`Failed to assign farm: ${response.statusText}`);
  }
  return response.json();
}

export async function unassignFarmFromUser(userId, locationId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/farms/${locationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to unassign farm: ${response.statusText}`);
  }
  return true;
}

// ---------------- ANALYTICS & COMPARISON APIS ----------------

export async function fetchFarmComparison(locationIds = null) {
  let url = `${API_BASE_URL}/analytics/comparison`;
  if (locationIds && locationIds.length > 0) {
    url += `?location_ids=${locationIds.join(',')}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch comparison analytics: ${response.statusText}`);
  }
  return response.json();
}

// ---------------- EXISTING TELEMETRY & LOCATIONS APIS (PRESERVED) ----------------

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
