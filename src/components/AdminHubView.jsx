import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  BarChart3, 
  X, 
  Lock, 
  Mail, 
  UserPlus, 
  Layers, 
  RefreshCw, 
  ArrowUpDown,
  Download,
  Activity,
  Droplets,
  TestTube,
  Gauge,
  FileText,
  BrainCircuit
} from 'lucide-react';
import { 
  fetchAllUsers, 
  createNewUser, 
  updateUser, 
  deleteUser, 
  assignFarmToUser, 
  unassignFarmFromUser,
  fetchFarmComparison
} from '../services/api';
import SoilReportModal from './SoilReportModal';

export default function AdminHubView({ 
  currentUser, 
  locationsList = [], 
  onSelectLocation,
  setActiveTab 
}) {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'comparison'
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [assigningFarmsUser, setAssigningFarmsUser] = useState(null);
  const [reportModalLocationId, setReportModalLocationId] = useState(null);
  const [reportModalLocationName, setReportModalLocationName] = useState(null);

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    assigned_farms: []
  });

  // Comparison State
  const [comparisonData, setComparisonData] = useState([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [sortField, setSortField] = useState('health_score');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load Users
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUserError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.warn('Failed to load users from backend:', err);
      // Fallback local baseline if offline
      setUsers([
        { id: 1, username: 'admin', email: 'admin@terrapulse.ag', full_name: 'System Administrator', role: 'admin', is_active: true, assigned_farms: [] },
        { id: 2, username: 'farmer_nitk', email: 'farmer.nitk@terrapulse.ag', full_name: 'NITK Surathkal Research Farm', role: 'user', is_active: true, assigned_farms: ['LOC_001'] },
        { id: 3, username: 'farmer_pune', email: 'ramesh.patil@terrapulse.ag', full_name: 'Ramesh Patil', role: 'user', is_active: true, assigned_farms: ['LOC_002'] }
      ]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load Comparison Data
  const loadComparison = async () => {
    setIsLoadingComparison(true);
    try {
      const res = await fetchFarmComparison();
      if (res && res.farms) {
        setComparisonData(res.farms);
      }
    } catch (err) {
      console.warn('Using client-side fallback comparison data:', err);
      // Generate comparison from locationsList
      const generated = locationsList.map(loc => {
        const isDemo = loc.locationStatus === 'DEMO';
        const tele = isDemo ? loc.simulatedTelemetry : null;
        return {
          location_id: loc.id,
          name: loc.farmerName ? `${loc.farmerName} Farm` : (loc.name || loc.farmName),
          current_crop: loc.crop || loc.current_crop || 'General Plant',
          growth_stage: loc.growth_stage ?? 1,
          sensor_id: loc.sensor_id || loc.sensorId || 'SN_001',
          soil_type: loc.soil_type || 'Loamy Silt',
          coverage_area: loc.coverage_area || 'Sensor Pod',
          status: loc.status || 'active',
          health_score: tele?.evaluation?.health_score ?? (loc.id === 'LOC_001' ? 100 : (loc.healthStatus === 'Critical' ? 42 : 88)),
          health_status: loc.healthStatus || 'Healthy',
          latest_reading: tele?.reading || {
            moisture_pct: 27.4,
            temperature_c: 21.5,
            ph: 6.78,
            ec_ds_m: 1.18,
            nitrogen_mg_kg: 52.5,
            phosphorus_mg_kg: 27.5,
            potassium_mg_kg: 104.0,
            battery_pct: 98.0
          }
        };
      });
      setComparisonData(generated);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadComparison();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createNewUser(newUserForm);
      setIsAddUserModalOpen(false);
      setNewUserForm({ username: '', email: '', password: '', full_name: '', role: 'user', assigned_farms: [] });
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await updateUser(userId, updates);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleFarmAssignment = async (userId, locationId, isCurrentlyAssigned) => {
    try {
      if (isCurrentlyAssigned) {
        await unassignFarmFromUser(userId, locationId);
      } else {
        await assignFarmToUser(userId, [locationId]);
      }
      loadUsers();
      // Update modal state
      setAssigningFarmsUser(prev => {
        if (!prev) return null;
        const currentFarms = prev.assigned_farms || [];
        const nextFarms = isCurrentlyAssigned 
          ? currentFarms.filter(id => id !== locationId)
          : [...currentFarms, locationId];
        return { ...prev, assigned_farms: nextFarms };
      });
    } catch (err) {
      alert(err.message || 'Failed to update farm assignment');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(u => 
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // Filtered and Sorted Comparison
  const sortedComparison = useMemo(() => {
    let list = [...comparisonData];
    if (comparisonSearch) {
      const q = comparisonSearch.toLowerCase();
      list = list.filter(f => 
        f.location_id?.toLowerCase().includes(q) ||
        f.name?.toLowerCase().includes(q) ||
        f.current_crop?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;
      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [comparisonData, comparisonSearch, sortField, sortDirection]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6 font-sans">
      
      {/* Admin Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Admin Governance Hub
            </span>
            <span className="text-xs text-slate-400">
              Total Managed Sites: <strong className="text-emerald-400 font-mono">{locationsList.length}</strong>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span>Farm Administration & Multi-Site Analytics</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-1">
            Manage user accounts, assign field ownership to farmers, and analyze cross-farm soil telemetry side-by-side.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User & Farm Assignments</span>
          </button>

          <button
            onClick={() => setActiveSubTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'comparison'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Multi-Farm Comparison</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* TAB 1: USERS & FARM ASSIGNMENTS */}
        {activeSubTab === 'users' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users or email..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={loadUsers}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center gap-1.5"
                  title="Reload users"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Assigned Farm(s)</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-100">{u.full_name || u.username}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username} &bull; {u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === 'admin'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}>
                              {u.role === 'admin' ? 'Administrator' : 'Farmer / User'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                              <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === 'admin' ? (
                              <span className="text-[11px] text-emerald-400 font-semibold italic">
                                Global Access (All {locationsList.length} Farms)
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {u.assigned_farms && u.assigned_farms.length > 0 ? (
                                  u.assigned_farms.map(fId => {
                                    const locObj = locationsList.find(l => l.id === fId);
                                    return (
                                      <span key={fId} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-mono flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                                        <span>{fId} {locObj ? `(${locObj.farmerName || locObj.name})` : ''}</span>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-amber-400/80 italic">No farm assigned</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => setAssigningFarmsUser(u)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                                  title="Manage Farm Assignments"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Assign Farms</span>
                                </button>
                              )}
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit User"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {u.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/40 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-FARM COMPARISON */}
        {activeSubTab === 'comparison' && (
          <div className="space-y-6">
            
            {/* Comparison Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={comparisonSearch}
                  onChange={(e) => setComparisonSearch(e.target.value)}
                  placeholder="Filter by Farm Name, ID, or Crop..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">Sort By:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="health_score">Health Score</option>
                  <option value="name">Farm Name</option>
                  <option value="location_id">Location ID</option>
                  <option value="current_crop">Crop</option>
                </select>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase text-[10px]">{sortDirection}</span>
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Site / Farm</th>
                      <th className="px-5 py-3.5">Crop & Stage</th>
                      <th className="px-5 py-3.5">Health Score</th>
                      <th className="px-5 py-3.5">Moisture (%)</th>
                      <th className="px-5 py-3.5">pH</th>
                      <th className="px-5 py-3.5">EC (dS/m)</th>
                      <th className="px-5 py-3.5">N - P - K (mg/kg)</th>
                      <th className="px-5 py-3.5">Node Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {sortedComparison.map(farm => {
                      const reading = farm.latest_reading || {};
                      const score = farm.health_score ?? 75;
                      return (
                        <tr key={farm.location_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-100">{farm.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span>{farm.location_id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold capitalize text-slate-200">{farm.current_crop}</div>
                            <div className="text-[10px] text-slate-400">Stage {farm.growth_stage}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold text-sm ${
                                score >= 80 ? 'text-emerald-400' : (score >= 50 ? 'text-amber-400' : 'text-rose-400')
                              }`}>
                                {score}
                              </span>
                              <div className="w-16 bg-slate-800 rounded-full h-1.5 hidden sm:block">
                                <div 
                                  className={`h-1.5 rounded-full ${score >= 80 ? 'bg-emerald-400' : (score >= 50 ? 'bg-amber-400' : 'bg-rose-400')}`}
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-blue-400 font-semibold">
                            {reading.moisture_pct !== undefined ? `${reading.moisture_pct}%` : '27.4%'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold">
                            {reading.ph !== undefined ? reading.ph : '6.78'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-amber-400 font-semibold">
                            {reading.ec_ds_m !== undefined ? reading.ec_ds_m : '1.18'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-200">
                            {reading.nitrogen_mg_kg ?? 52.5} / {reading.phosphorus_mg_kg ?? 27.5} / {reading.potassium_mg_kg ?? 104.0}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>{farm.sensor_id} (Online)</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReportModalLocationId(farm.location_id);
                                  setReportModalLocationName(farm.name);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 flex items-center gap-1"
                                title="Generate AI Soil Report"
                              >
                                <FileText className="w-3 h-3" />
                                Report
                              </button>
                              <button
                                onClick={() => {
                                  onSelectLocation(farm.location_id);
                                  setActiveTab('map');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD NEW USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Create New User</span>
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  placeholder="e.g. farmer_karnataka"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="farmer@domain.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="e.g. Anand Murthy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">Farmer / Regular User (Assigned Farms Only)</option>
                  <option value="admin">System Administrator (Full Global Access)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE FARM ASSIGNMENTS */}
      {assigningFarmsUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setAssigningFarmsUser(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Access Control
              </span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Farm Assignments for {assigningFarmsUser.full_name || assigningFarmsUser.username}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select which registered farms this farmer is authorized to monitor.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
              {locationsList.map(farm => {
                const isAssigned = (assigningFarmsUser.assigned_farms || []).includes(farm.id);
                return (
                  <div
                    key={farm.id}
                    onClick={() => handleToggleFarmAssignment(assigningFarmsUser.id, farm.id, isAssigned)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isAssigned
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className="font-mono text-emerald-400">{farm.id}</span>
                        <span>{farm.farmerName ? `${farm.farmerName} Farm` : farm.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {farm.village || 'Surathkal'}, {farm.state || 'Karnataka'} &bull; Crop: {farm.crop || farm.current_crop}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      isAssigned ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                    }`}>
                      {isAssigned && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAssigningFarmsUser(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Edit className="w-5 h-5 text-emerald-400" />
              <span>Edit User: @{editingUser.username}</span>
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser(editingUser.id, {
                  full_name: editingUser.full_name,
                  email: editingUser.email,
                  role: editingUser.role,
                  is_active: editingUser.is_active
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">Regular User (Farmer)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="user-active-checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="user-active-checkbox" className="text-slate-300 font-medium">
                  Account is Active
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOIL HEALTH REPORT MODAL (Admin) */}
      {reportModalLocationId && (
        <SoilReportModal
          locationId={reportModalLocationId}
          locationName={reportModalLocationName}
          onClose={() => { setReportModalLocationId(null); setReportModalLocationName(null); }}
        />
      )}

    </div>
  );
}
