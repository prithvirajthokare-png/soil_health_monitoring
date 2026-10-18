// Detect runtime environment
const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const hasCustomApiUrl = Boolean(import.meta.env.VITE_API_URL);
const shouldAttemptBackend = hasCustomApiUrl || isLocal;

const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8000/api/v1' : '');

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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });

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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

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
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
      });
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

// ---------------- EXISTING TELEMETRY & LOCATIONS APIS (PRESERVED) ----------------

export async function fetchLocationById(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch location ${locationId}: ${response.statusText}`);
    }
    return response.json();
  }
  return null;
}

export async function fetchLatestReading(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/latest`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  }
  return null;
}

export async function fetchEvaluation(locationId = 'LOC_001') {
  if (shouldAttemptBackend && API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/evaluation`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  }
  return null;
}

export async function fetchAllLocations() {
  if (shouldAttemptBackend && API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/locations`);
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    return response.json();
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
