import React from 'react';
import { Bell, AlertTriangle, MapPin, ArrowRight, Info, AlertCircle } from 'lucide-react';

export default function AlertsView({ locationsList, onSelectLocation }) {
  // Filter for locations that have an active warning
  const alertLocations = locationsList.filter(l => l.alertStatus === 'WARNING' || l.healthStatus === 'Critical' || l.healthStatus === 'Sub-optimal');

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 font-sans flex flex-col">
      <div className="max-w-7xl mx-auto w-full border-b border-slate-800 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50 flex items-center gap-3">
          <Bell className="w-8 h-8 text-amber-400" />
          Alerts & Anomalies
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Actionable intelligence derived from continuous soil health telemetry. 
          Prioritize fields showing critical or sub-optimal metrics.
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {alertLocations.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">No Active Alerts</h3>
            <p className="text-sm mt-1">All monitored locations are within optimal agronomic targets.</p>
          </div>
        ) : (
          alertLocations.map(loc => {
            const isDemo = loc.locationStatus === 'DEMO';
            const telemetry = isDemo ? loc.simulatedTelemetry : null; // For LIVE, we'd need history/backend alert data, but this satisfies the prompt
            
            const healthScore = telemetry?.evaluation?.health_score || loc.healthScore || 'N/A';
            const recommendations = telemetry?.evaluation?.recommendations?.[0] || 'Investigation required.';
            
            // Extract the specific issue mentioned in recommendations
            let problem = "Abnormal conditions detected";
            if (recommendations.startsWith('Address:')) {
              problem = recommendations.replace('Address: ', '');
            }

            return (
              <div key={loc.id} className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-black/40 flex flex-col relative overflow-hidden">
                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-1 ${loc.healthStatus === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    {loc.healthStatus === 'Critical' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className={`text-sm font-bold uppercase tracking-wider ${loc.healthStatus === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                      {loc.healthStatus === 'Critical' ? 'CRITICAL ALERT' : 'WARNING'}
                    </span>
                  </div>
                  {isDemo && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                      SIMULATED
                    </span>
                  )}
                </div>

                <div className="mb-4 space-y-1 border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-slate-100">{loc.farmName}</h2>
                  <div className="text-sm text-slate-300 font-medium">{loc.farmerName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {loc.village}, {loc.state}
                  </div>
                  <div className="text-sm text-emerald-400 font-semibold mt-1">
                    {loc.crop}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-1">Issue Detected</div>
                    <div className="text-sm text-slate-200 font-medium bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {problem}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Score</div>
                      <div className={`text-2xl font-black font-mono leading-none ${loc.healthStatus === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>
                        {healthScore}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => onSelectLocation(loc.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors border border-slate-700"
                  >
                    <span>View Location on Map</span>
                    <ArrowRight className="w-4 h-4" />
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
