const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Built-in Demo Accounts (Available both on backend and as resilient offline fallback)
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

  // 1. Attempt Live Backend Login
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
    // If response was 404 / 500 / 502, fall through to resilient offline fallback
  } catch (err) {
    if (err.message && (err.message.includes('Incorrect') || err.message.includes('deactivated'))) {
      throw err;
    }
    console.warn('[API Service] Backend unavailable or route not found, falling back to local demo authentication:', err.message);
  }

  // 2. Resilient Offline / Demo Fallback
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

  // 1. Attempt Live Backend Registration
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

  // 2. Resilient Offline Registration Fallback
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

  // Return stored user if backend is offline
  return getStoredUser();
}

export function logoutUser() {
  setStoredToken(null);
  setStoredUser(null);
}

// ---------------- USER MANAGEMENT APIS (ADMIN ONLY) ----------------

export async function fetchAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {}

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

  // Local fallback
  const storedUsers = getStoredLocalUsers();
  const updatedList = storedUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
  saveStoredLocalUsers(updatedList);
  return { id: userId, ...updates };
}

export async function deleteUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return true;
    }
  } catch (err) {}

  const storedUsers = getStoredLocalUsers();
  saveStoredLocalUsers(storedUsers.filter(u => u.id !== userId));
  return true;
}

export async function assignFarmToUser(userId, locationIds, roleOnFarm = 'owner') {
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
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/farms/${locationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return true;
    }
  } catch (err) {}

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
