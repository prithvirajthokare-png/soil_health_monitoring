import React from 'react';
import { Bell, AlertTriangle, MapPin, ArrowRight, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AlertsView({ locationsList = [], onSelectLocation }) {
  const safeLocations = Array.isArray(locationsList) ? locationsList : [];
  
  // Filter for locations that have an active warning or critical status
  const alertLocations = safeLocations.filter(l => 
    l && (l.alertStatus === 'WARNING' || l.alertStatus === 'CRITICAL' || l.healthStatus === 'Critical' || l.healthStatus === 'Sub-optimal')
  );

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 font-sans flex flex-col">
      <div className="max-w-7xl mx-auto w-full border-b border-slate-800 pb-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 flex items-center gap-3">
          <Bell className="w-7 h-7 text-amber-400" />
          Field Alerts & Warnings
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-2xl">
          Automatic alerts when soil gets too dry, fertilizer levels drop, or crops need attention.
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {alertLocations.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 bg-slate-900/30">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-200">All Fields Healthy</h3>
            <p className="text-sm text-slate-400 mt-1 text-center max-w-md">
              Water, nutrients, and soil temperature are all at good levels across your monitored fields.
            </p>
          </div>
        ) : (
          alertLocations.map(loc => {
            const isDemo = loc.locationStatus === 'DEMO';
            const telemetry = isDemo ? loc.simulatedTelemetry : null;
            
            const healthScore = telemetry?.evaluation?.health_score || loc.healthScore || 'N/A';
            const rawRec = telemetry?.evaluation?.recommendations?.[0];
            const recommendations = typeof rawRec === 'string' ? rawRec : (rawRec?.action || 'Water or nutrient check recommended.');
            
            let problem = "Abnormal conditions detected";
            if (typeof recommendations === 'string' && recommendations.startsWith('Address:')) {
              problem = recommendations.replace('Address: ', '');
            } else if (typeof recommendations === 'string') {
              problem = recommendations;
            }

            const isCritical = loc.healthStatus === 'Critical' || loc.alertStatus === 'CRITICAL';

            return (
              <div key={loc.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg shadow-black/40 flex flex-col relative overflow-hidden transition-all">
                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                      {isCritical ? 'Needs Immediate Attention' : 'Warning'}
                    </span>
                  </div>
                  {isDemo && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                      Demo Sensor
                    </span>
                  )}
                </div>

                <div className="mb-4 space-y-1 border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-slate-100">{loc.farmName || loc.name}</h2>
                  <div className="text-xs text-slate-300 font-medium">{loc.farmerName || 'Assigned Field'}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{loc.village || 'Field'}, {loc.state || 'Karnataka'}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">What to do</div>
                    <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {problem}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Soil Health Score</div>
                      <div className="text-xs text-slate-400">Target is 80+</div>
                    </div>
                    <div className={`text-2xl font-black font-mono ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                      {healthScore}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => onSelectLocation && onSelectLocation(loc.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
                  >
                    <span>View Field on Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
