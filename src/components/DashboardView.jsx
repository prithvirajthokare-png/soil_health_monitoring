import React, { useMemo } from 'react';
import { LayoutDashboard, Map, MapPin, Bell, Users, Activity, BarChart3, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DashboardView({ 
  locationData, 
  latestReading, 
  evaluationData, 
  locationsList,
  setActiveTab 
}) {
  const stats = useMemo(() => {
    const list = locationsList || [];
    const total = list.length;
    const live = list.filter(l => l.locationStatus === 'LIVE').length;
    const demo = list.filter(l => l.locationStatus === 'DEMO').length;
    const activeSensors = list.filter(l => l.locationStatus === 'LIVE' && l.sensorStatus === 'ONLINE').length;
    
    // Health
    let healthy = 0, warning = 0, critical = 0;
    
    // Crops
    const crops = {};
    
    // States
    const states = {};

    list.forEach(l => {
      // Health/Alerts
      if (l.alertStatus === 'CRITICAL' || l.healthStatus === 'Critical') critical++;
      else if (l.alertStatus === 'WARNING' || l.healthStatus === 'Sub-optimal') warning++;
      else healthy++;
      
      // Crop
      const c = l.crop || l.current_crop;
      if (c) {
        crops[c] = (crops[c] || 0) + 1;
      }
      
      // State
      if (l.state) {
        states[l.state] = (states[l.state] || 0) + 1;
      }
    });

    const sortedCrops = Object.entries(crops).sort((a,b) => b[1] - a[1]);
    const sortedStates = Object.entries(states).sort((a,b) => b[1] - a[1]);
    
    return {
      total, live, demo, activeSensors,
      healthy, warning, critical,
      crops: sortedCrops,
      states: sortedStates,
      alerts: list.filter(l => l.alertStatus === 'WARNING' || l.alertStatus === 'CRITICAL' || l.healthStatus === 'Critical' || l.healthStatus === 'Sub-optimal')
    };
  }, [locationsList]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col gap-2 border-b border-slate-800 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-50">
          Soil Health Monitoring System
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-3xl">
          A LoRaWAN-based soil monitoring platform for distributed agricultural locations.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Statistics Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Monitored Sites</span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100">{stats.total}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Live Sites</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-400">{stats.live}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Demo Sites</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-blue-400">{stats.demo}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Active Real Sensors</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100">{stats.activeSensors}</div>
          </div>
        </section>

        {/* Action / Map Area */}
        <section className="py-2">
          <button
            onClick={() => setActiveTab('map')}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl shadow-emerald-900/30 transition-all font-bold text-base"
          >
            <span>Open Live Map</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Health Distribution */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Health Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Healthy', value: stats.healthy, color: 'bg-emerald-500' },
                { label: 'Warning / Sub-optimal', value: stats.warning, color: 'bg-amber-500' },
                { label: 'Critical', value: stats.critical, color: 'bg-rose-500' }
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold">{item.label}</span>
                    <span className="font-mono font-bold">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${stats.total ? (item.value / stats.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Summary */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Alert Summary</h2>
            <div className="flex h-32 items-end justify-around gap-2">
              {[
                { label: 'Healthy', value: stats.healthy, color: 'bg-emerald-500', hColor: 'text-emerald-400' },
                { label: 'Warning', value: stats.warning, color: 'bg-amber-500', hColor: 'text-amber-400' },
                { label: 'Critical', value: stats.critical, color: 'bg-rose-500', hColor: 'text-rose-400' }
              ].map(item => {
                const heightPct = Math.max(10, stats.total ? (item.value / stats.total) * 100 : 0);
                return (
                  <div key={item.label} className="flex flex-col items-center gap-2 w-1/3">
                    <span className={`font-mono font-bold text-lg ${item.hColor}`}>{item.value}</span>
                    <div className={`w-full max-w-[40px] ${item.color} rounded-t-sm transition-all duration-1000`} style={{ height: `${heightPct}%` }}></div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crop Distribution */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Crop Distribution</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.crops.map(([crop, count]) => (
                <div key={crop}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium capitalize">{crop}</span>
                    <span className="font-mono text-slate-300">{count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(count / stats.crops[0][1]) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* State Distribution */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">State Distribution</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.states.map(([state, count]) => (
                <div key={state}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium capitalize">{state}</span>
                    <span className="font-mono text-slate-300">{count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(count / stats.states[0][1]) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Recent/Critical Alerts */}
        <section className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl mb-12">
          <h2 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Recent Alerts
          </h2>
          {stats.alerts.length === 0 ? (
            <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-800 rounded-lg text-center">
              No active alerts detected across the network.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-3 font-semibold">Farm</th>
                    <th className="pb-3 font-semibold">Crop</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.alerts.slice(0, 5).map((alert) => (
                    <tr key={alert.id} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-3 font-medium text-slate-200">{alert.farmName || alert.name}</td>
                      <td className="py-3 text-slate-400 capitalize">{alert.crop || alert.current_crop}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          alert.alertStatus === 'CRITICAL' || alert.healthStatus === 'Critical'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {alert.alertStatus === 'CRITICAL' || alert.healthStatus === 'Critical' ? 'Critical' : 'Warning'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => {
                            setActiveTab('map');
                            // Let the map render before simulating selection
                            setTimeout(() => {
                                const btn = document.querySelector(`[title^="Target ${alert.id}"]`);
                                if (!btn) {
                                  // Find in locations list and click
                                  const btns = Array.from(document.querySelectorAll('button'));
                                  const sidebarBtn = btns.find(b => b.innerText.includes(alert.farmName || alert.id));
                                  if (sidebarBtn) sidebarBtn.click();
                                } else {
                                  btn.click();
                                }
                            }, 50);
                          }}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          View Location
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
