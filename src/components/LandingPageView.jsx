import React, { useState } from 'react';
import { 
  Sprout, 
  ShieldCheck, 
  Radio, 
  MapPin, 
  Activity, 
  Layers, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Users,
  Compass,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function LandingPageView({ onLoginSuccess, onExploreGuest }) {
  const [activeMode, setActiveMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleQuickLogin = async (demoUsername, demoPassword) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await loginUser(demoUsername, demoPassword);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (activeMode === 'login') {
        const data = await loginUser(username, password);
        onLoginSuccess(data.user);
      } else {
        const data = await registerUser({
          username,
          email,
          password,
          full_name: fullName || username,
          role: selectedRole,
          assigned_farms: selectedRole === 'user' ? ['LOC_001'] : []
        });
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-white shadow-xl shadow-emerald-950 ring-1 ring-emerald-400/40">
              <Sprout className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-green-400 bg-clip-text text-transparent">
                  TerraPulse
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Soil Health OS v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                LoRaWAN Precision Agriculture & Soil Health Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreGuest}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>Explore as Guest</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <a
              href="#login-portal"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero & Authentication Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Platform Overview & Value Props */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role-Based Agricultural GIS & Telemetry Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-50 leading-[1.15]">
            Empowering Farmers & Agronomists with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">Real-Time Soil Health</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            TerraPulse continuously monitors soil moisture, temperature, pH, electrical conductivity (EC), and NPK macronutrients using Dragino RS485-LN LoRaWAN nodes. Designed with separate, tailored workspaces for central farm administrators and individual farmers.
          </p>

          {/* Key Architectural Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">LoRaWAN & RS485-LN Telemetry</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Direct integration with ChirpStack webhook uplinks and continuous 48-hour time series logging.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">Role-Based Access Control</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Admins supervise and compare all registered sites; Farmers get private, focused access to their assigned acreage.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">114 Crop Growth Targets</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Dynamic automated evaluations and recommendations across Seedling, Vegetative, and Fruiting stages.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100">Agricultural GIS Mapping</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Interactive spatial boundaries, polygon area calculations, and high-resolution satellite imagery.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login / Register Card */}
        <div id="login-portal" className="lg:col-span-5">
          <div className="relative bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Ambient edge glow */}
            <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => { setActiveMode('login'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeMode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeMode === 'register'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Quick Demo Login Pill Bar */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>Instant 1-Click Demo Login</span>
                <span className="text-[10px] text-emerald-400 font-mono">Ready to test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  disabled={isLoading}
                  className="text-left px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">All 50 Farms & User Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('farmer_nitk', 'farmer123')}
                  disabled={isLoading}
                  className="text-left px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all text-xs group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-blue-300">
                    <User className="w-3.5 h-3.5" />
                    <span>NITK Farmer</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Assigned: Idea Factory</div>
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('farmer_pune', 'farmer123')}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 transition-all text-xs group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ramesh Patil (Pune Farmer)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Assigned: LOC_002 (Maharashtra Test Field)</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
                Or Sign In with Credentials
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        required
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="farmer@domain.com"
                        required
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Account Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="user">Regular User (Farmer)</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeMode === 'login' ? 'Sign In to Dashboard' : 'Register & Access Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onExploreGuest}
                className="text-xs text-slate-400 hover:text-emerald-400 underline underline-offset-4 transition-colors"
              >
                Continue as Guest (Read-Only Preview)
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-medium">
        <p>TerraPulse Precision Agriculture System &bull; NITK Surathkal Research Project &bull; LoRaWAN RS485-LN Integration</p>
      </footer>
    </div>
  );
}
