// Detect runtime environment
const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const hasCustomApiUrl = Boolean(import.meta.env.VITE_API_URL);
const shouldAttemptBackend = hasCustomApiUrl || isLocal;

const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8000/api/v1' : '');

// Safe fetch with built-in timeout to prevent UI freezes when backend is offline
async function fetchWithTimeout(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Built-in Demo Accounts (Available both on backend and as resilient offline/Vercel fallback)
const BUILTIN_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@terrapulse.ag',
    password: 'admin123',
    full_name: 'System Administrator',
    role: 'admin',
    is_active: true,
    assigned_farms: []
  },
  {
    id: 2,
    username: 'farmer_nitk',
    email: 'farmer.nitk@terrapulse.ag',
    password: 'farmer123',
    full_name: 'NITK Surathkal Research Farm',
    role: 'user',
    is_active: true,
    assigned_farms: ['LOC_001']
  },
  {
    id: 3,
    username: 'farmer_pune',
    email: 'ramesh.patil@terrapulse.ag',
    password: 'farmer123',
    full_name: 'Ramesh Patil',
    role: 'user',
    is_active: true,
    assigned_farms: ['LOC_002']
  }
];

function getStoredLocalUsers() {
  try {
    const raw = localStorage.getItem('terrapulse_local_users');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredLocalUsers(users) {
  try {
    localStorage.setItem('terrapulse_local_users', JSON.stringify(users));
  } catch (e) {}
}

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
  const cleanUsername = (username || '').trim().toLowerCase();

  // 1. Attempt Live Backend Login if running locally or custom backend URL is configured
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      }, 1000);

      if (response.ok) {
        const data = await response.json();
        setStoredToken(data.access_token);
        setStoredUser(data.user);
        return data;
      }

      if (response.status === 401) {
        throw new Error('Incorrect username or password');
      }

      if (response.status === 403) {
        let detail = 'Account is deactivated';
        try {
          const errJson = await response.json();
          if (errJson.detail) detail = errJson.detail;
        } catch (e) {}
        throw new Error(detail);
      }
    } catch (err) {
      if (err.message && (err.message.includes('Incorrect') || err.message.includes('deactivated'))) {
        throw err;
      }
      console.warn('[API Service] Backend unavailable or route not found, falling back to local demo authentication:', err.message);
    }
  }

  // 2. Resilient Offline / Vercel Cloud Demo Fallback
  const storedUsers = getStoredLocalUsers();
  const allUsers = [...BUILTIN_USERS, ...storedUsers];
  const matched = allUsers.find(u => 
    (u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)) && 
    u.password === password
  );

  if (matched) {
    const fallbackUser = {
      id: matched.id,
      username: matched.username,
      email: matched.email,
      full_name: matched.full_name,
      role: matched.role,
      is_active: matched.is_active ?? true,
      assigned_farms: matched.assigned_farms || (matched.role === 'user' ? ['LOC_001'] : [])
    };
    const fallbackData = {
      access_token: `terrapulse_token_${matched.role}_${Date.now()}`,
      token_type: 'bearer',
      user: fallbackUser
    };
    setStoredToken(fallbackData.access_token);
    setStoredUser(fallbackData.user);
    return fallbackData;
  }

  throw new Error('Incorrect username or password. For demo access, use admin / admin123 or farmer_nitk / farmer123');
}

export async function registerUser(userData) {
  const cleanUsername = (userData.username || '').trim().toLowerCase();
  const cleanEmail = (userData.email || '').trim().toLowerCase();

  // 1. Attempt Live Backend Registration if reachable
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }, 1500);

      if (response.ok) {
        const data = await response.json();
        setStoredToken(data.access_token);
        setStoredUser(data.user);
        return data;
      }

      if (response.status === 400) {
        let detail = 'Registration failed';
        try {
          const errJson = await response.json();
          if (errJson.detail) detail = errJson.detail;
        } catch (e) {}
        throw new Error(detail);
      }
    } catch (err) {
      if (err.message && err.message.includes('already')) {
        throw err;
      }
      console.warn('[API Service] Backend unavailable for registration, using local fallback:', err.message);
    }
  }

  // 2. Resilient Offline / Vercel Registration Fallback
  const storedUsers = getStoredLocalUsers();
  const exists = [...BUILTIN_USERS, ...storedUsers].some(u => 
    u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );

  if (exists) {
    throw new Error(`Username '${cleanUsername}' or email is already registered.`);
  }

  const newUser = {
    id: Date.now(),
    username: cleanUsername,
    email: cleanEmail,
    password: userData.password,
    full_name: userData.full_name || cleanUsername,
    role: userData.role || 'user',
    is_active: true,
    assigned_farms: userData.assigned_farms || (userData.role === 'user' ? ['LOC_001'] : [])
  };

  saveStoredLocalUsers([...storedUsers, newUser]);

  const fallbackUser = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    full_name: newUser.full_name,
    role: newUser.role,
    is_active: true,
    assigned_farms: newUser.assigned_farms
  };

  const fallbackData = {
    access_token: `terrapulse_token_${newUser.role}_${Date.now()}`,
    token_type: 'bearer',
    user: fallbackUser
  };

  setStoredToken(fallbackData.access_token);
  setStoredUser(fallbackData.user);
  return fallbackData;
}

export async function fetchCurrentUserProfile() {
  const token = getStoredToken();
  if (!token) return null;

  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
      }, 1500);
      if (response.ok) {
        const user = await response.json();
        setStoredUser(user);
        return user;
      }
      if (response.status === 401) {
        setStoredToken(null);
        setStoredUser(null);
        return null;
      }
    } catch (e) {}
  }

  // Return stored user if backend is offline or on Vercel
  return getStoredUser();
}

export function logoutUser() {
  setStoredToken(null);
  setStoredUser(null);
}

// ---------------- USER MANAGEMENT APIS (ADMIN ONLY) ----------------

export async function fetchAllUsers() {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }

  // Fallback to local users
  const storedUsers = getStoredLocalUsers();
  return [...BUILTIN_USERS, ...storedUsers].map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active ?? true,
    assigned_farms: u.assigned_farms || []
  }));
}

export async function createNewUser(userData) {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }

  // Local fallback
  const storedUsers = getStoredLocalUsers();
  const newUser = {
    id: Date.now(),
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
    full_name: userData.full_name,
    role: userData.role || 'user',
    is_active: true,
    assigned_farms: userData.assigned_farms || []
  };
  saveStoredLocalUsers([...storedUsers, newUser]);
  return newUser;
}

export async function updateUser(userId, updates) {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }

  // Local fallback
  const storedUsers = getStoredLocalUsers();
  const updatedList = storedUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
  saveStoredLocalUsers(updatedList);
  return { id: userId, ...updates };
}

export async function deleteUser(userId) {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return true;
      }
    } catch (err) {}
  }

  const storedUsers = getStoredLocalUsers();
  saveStoredLocalUsers(storedUsers.filter(u => u.id !== userId));
  return true;
}

export async function assignFarmToUser(userId, locationIds, roleOnFarm = 'owner') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/farms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ location_ids: locationIds, role_on_farm: roleOnFarm })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }

  const storedUsers = getStoredLocalUsers();
  const user = storedUsers.find(u => u.id === userId) || BUILTIN_USERS.find(u => u.id === userId);
  if (user) {
    const current = new Set(user.assigned_farms || []);
    locationIds.forEach(id => current.add(id));
    user.assigned_farms = Array.from(current);
    saveStoredLocalUsers([...storedUsers.filter(u => u.id !== userId), user]);
    return user;
  }
  return null;
}

export async function unassignFarmFromUser(userId, locationId) {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/farms/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return true;
      }
    } catch (err) {}
  }

  const storedUsers = getStoredLocalUsers();
  const user = storedUsers.find(u => u.id === userId) || BUILTIN_USERS.find(u => u.id === userId);
  if (user) {
    user.assigned_farms = (user.assigned_farms || []).filter(id => id !== locationId);
    saveStoredLocalUsers([...storedUsers.filter(u => u.id !== userId), user]);
    return true;
  }
  return true;
}

// ---------------- ANALYTICS & COMPARISON APIS ----------------

export async function fetchFarmComparison(locationIds = null) {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      let url = `${API_BASE_URL}/analytics/comparison`;
      if (locationIds && locationIds.length > 0) {
        url += `?location_ids=${locationIds.join(',')}`;
      }
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }

  return null;
}

// ---------------- AI ANALYTICS APIS ----------------

export async function fetchIrrigationPrediction(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations/${locationId}/ai/prediction`, {
        headers: getAuthHeaders()
      }, 1500);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }
  // Offline fallback: simulate a rule-based prediction from demo baseline
  return _fallbackPrediction();
}

export async function fetchSoilHealthReport(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations/${locationId}/ai/report`, {
        headers: getAuthHeaders()
      }, 1500);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
  }
  // Offline fallback: generate a minimal demo report
  return _fallbackReport(locationId);
}

function _fallbackPrediction() {
  return {
    has_trend: true,
    slope_pct_per_hour: -0.012,
    current_moisture_pct: 27.4,
    predicted_hours_to_trigger: 61.7,
    urgency: 'normal',
    confidence: 'medium',
    message: 'Irrigation not required for ~62 hours. Moisture (27.4%) declining gradually at 0.012%/hr. (Demo baseline)'
  };
}

function _fallbackReport(locationId) {
  return {
    meta: {
      location_id: locationId,
      location_name: 'Idea Factory Research Farm',
      current_crop: 'tomato',
      health_score: 85,
      health_status: 'Optimal',
      report_engine: 'offline-demo',
      report_version: '2.0'
    },
    executive_summary: {
      headline: `Soil Health Report: ${locationId}`,
      status_badge: 'Optimal',
      score: 85,
      health_narrative: 'This farm is in excellent agronomic condition. All major soil parameters are within optimal ranges. (Demo mode — connect backend for live data.)',
      irrigation_note: 'Irrigation not required for approximately 62 hours.',
      critical_issues: [],
      positive_findings: [
        'Soil moisture (27.4%) is optimal.',
        'pH (6.78) is in the ideal range.',
        'NPK levels are well balanced.'
      ]
    },
    metrics: [
      { metric: 'Moisture (VWC)', value: 27.4, unit: '%', status: 'optimal', status_label: '✅ Optimal', target: 28.0, reading_message: 'Soil moisture (27.4%) is optimal.', interpretation: 'Volumetric water content is ideal for root uptake and gas exchange.' },
      { metric: 'Soil pH', value: 6.78, unit: 'pH', status: 'optimal', status_label: '✅ Optimal', target: 6.75, reading_message: 'Soil pH (6.78) is in nominal range.', interpretation: 'pH is optimal for nutrient availability and microbial activity.' },
      { metric: 'Salinity (EC)', value: 1.18, unit: 'dS/m', status: 'optimal', status_label: '✅ Optimal', target: 1.2, reading_message: 'Salinity (1.18 dS/m) is safe.', interpretation: 'EC is within safe limits, minimizing osmotic stress.' }
    ],
    irrigation_forecast: {
      current_moisture: 27.4,
      trigger_threshold: 20.0,
      slope_pct_per_hour: -0.012,
      predicted_hours_to_trigger: 61.7,
      urgency: 'normal',
      confidence: 'medium',
      has_trend: true,
      forecast_message: 'Irrigation not required for ~62 hours.',
      methodology: 'Linear regression on recent moisture readings to compute drying rate.'
    },
    nutrient_analysis: {
      available: true,
      nitrogen: { value: 52.5, target: 40, status: 'optimal', note: 'Nitrogen (N): 52.5 mg/kg (31% above target of 40 mg/kg) — optimal' },
      phosphorus: { value: 27.5, target: 20, status: 'optimal', note: 'Phosphorus (P): 27.5 mg/kg (38% above target of 20 mg/kg) — optimal' },
      potassium: { value: 104.0, target: 100, status: 'optimal', note: 'Potassium (K): 104.0 mg/kg (4% above target of 100 mg/kg) — optimal' },
      npk_ratio: '52:27:104',
      balance_summary: 'All three macronutrients (N, P, K) are well balanced within target ranges.'
    },
    recommendations: [
      { priority: 1, category: 'Maintenance', action: 'All parameters are within optimal ranges. Continue current agronomic practices and maintain monitoring schedule.', urgency: 'routine' }
    ],
    action_plan: [
      { timeframe: 'Ongoing (Weekly)', actions: ['Review soil health evaluation daily via TerraPulse dashboard.', 'Monitor irrigation prediction trends and adjust scheduling accordingly.', 'Calibrate sensor nodes if battery drops below 20%.'] }
    ],
    engine: 'offline-demo',
    generated_at: new Date().toISOString()
  };
}

// ---------------- EXISTING TELEMETRY & LOCATIONS APIS (PRESERVED) ----------------

export async function fetchLocationById(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations/${locationId}`, {}, 1500);
      if (response.ok) return response.json();
    } catch (e) {}
  }
  return null;
}

export async function fetchLatestReading(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations/${locationId}/latest`, {}, 1500);
      if (response.ok) return response.json();
    } catch (e) {}
  }
  return null;
}

export async function fetchEvaluation(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations/${locationId}/evaluation`, {}, 1500);
      if (response.ok) return response.json();
    } catch (e) {}
  }
  return null;
}

export async function fetchAllLocations() {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations`, {}, 1500);
      if (response.ok) return response.json();
    } catch (e) {}
  }
  return [];
}

export function getExportDataUrl(locationId = 'LOC_001', range = '1week') {
  return `${API_BASE_URL}/locations/${locationId}/export?range=${range}`;
}

export async function downloadHistoricalDataCsv(locationId = 'LOC_001', range = '1week') {
  if (shouldAttemptBackend && API_BASE_URL) {
    const url = getExportDataUrl(locationId, range);
    try {
      const response = await fetch(url);
      if (response.ok) {
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
      }
    } catch (err) {}
  }

  // Fallback CSV generator for offline / Vercel cloud environment
  const headers = "Timestamp (UTC),Location ID,Location Name,Crop,Moisture (%),Temperature (C),pH,EC (dS/m),Nitrogen (mg/kg),Phosphorus (mg/kg),Potassium (mg/kg),Battery (%)\n";
  const now = new Date();
  const rows = [];
  const hoursCount = range === '1year' ? 365 : (range === '1month' ? 30 : 7);
  for (let i = 0; i < hoursCount; i++) {
    const d = new Date(now.getTime() - i * 3600 * 1000 * (range === '1year' ? 24 : 1));
    rows.push(`${d.toISOString()},${locationId},Field Farm,Tomato,27.4,21.5,6.78,1.18,52.5,27.5,104.0,98.0`);
  }
  const csvContent = headers + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
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
}

export async function fetchFullLocationState(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    try {
      const [location, latest, evaluation] = await Promise.all([
        fetchLocationById(locationId),
        fetchLatestReading(locationId).catch(() => null),
        fetchEvaluation(locationId).catch(() => null)
      ]);
      if (location) {
        return {
          location,
          latest,
          evaluation,
          isLive: true,
          error: null
        };
      }
    } catch (err) {}
  }

  return {
    location: null,
    latest: null,
    evaluation: null,
    isLive: false,
    error: null
  };
}
