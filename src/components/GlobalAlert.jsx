import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, MapPin, ArrowRight, X } from 'lucide-react';

export default function GlobalAlert({ locationData, evaluationData, latestReading, onDismiss, onViewLocation }) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedFingerprints, setDismissedFingerprints] = useState(new Set());

  useEffect(() => {
    if (!locationData || !evaluationData) return;
    
    const isCritical = evaluationData.health_status === 'Critical' || locationData.healthStatus === 'Critical';
    const isWarning = evaluationData.health_status === 'Sub-optimal' || locationData.healthStatus === 'Sub-optimal' || locationData.alertStatus === 'WARNING';
    
    if (isCritical || isWarning) {
      const score = evaluationData.health_score || locationData.healthScore || 0;
      // create a unique fingerprint based on ID, score, and status to prevent spamming
      const fingerprint = `${locationData.id}-${score}-${isCritical ? 'crit' : 'warn'}`;
      
      if (!dismissedFingerprints.has(fingerprint)) {
        let problem = "Abnormal conditions detected";
        const recs = evaluationData.recommendations?.[0] || '';
        if (recs.startsWith('Address:')) {
          problem = recs.replace('Address: ', '');
        }
        
        setActiveAlert({
          fingerprint,
          severity: isCritical ? 'CRITICAL' : 'WARNING',
          farmName: locationData.farmName || locationData.name,
          farmerName: locationData.farmerName,
          crop: locationData.crop || locationData.current_crop,
          score,
          problem,
          moisture: latestReading?.moisture_pct
        });
      }
    } else {
      setActiveAlert(null);
    }
  }, [locationData, evaluationData, latestReading, dismissedFingerprints]);

  if (!activeAlert) return null;

  const handleDismiss = () => {
    setDismissedFingerprints(prev => {
      const next = new Set(prev);
      next.add(activeAlert.fingerprint);
      return next;
    });
    setActiveAlert(null);
    if (onDismiss) onDismiss();
  };

  const handleView = () => {
    handleDismiss();
    if (onViewLocation) onViewLocation(locationData.id);
  };

  const isCritical = activeAlert.severity === 'CRITICAL';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-in slide-in-from-right-8 fade-in duration-300">
      <div className={`bg-slate-900 border-2 rounded-2xl p-5 shadow-2xl flex flex-col relative overflow-hidden ${isCritical ? 'border-red-500/80 shadow-red-900/40' : 'border-amber-500/80 shadow-amber-900/40'}`}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></div>
        
        <div className="flex justify-between items-start mb-3 mt-1">
          <div className="flex items-center gap-2">
            {isCritical ? (
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            <span className={`text-sm font-black uppercase tracking-wider ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
              {isCritical ? 'CRITICAL SOIL ALERT' : 'SOIL WARNING'}
            </span>
          </div>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 mb-3">
          <h2 className="text-lg font-bold text-slate-100 leading-tight">{activeAlert.farmName}</h2>
          <div className="text-sm text-slate-300">{activeAlert.farmerName}</div>
          <div className="text-xs text-emerald-400 font-semibold">{activeAlert.crop}</div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Health Score</span>
            <span className={`font-mono font-bold text-lg leading-none ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
              {activeAlert.score}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-300 font-medium">{activeAlert.problem}</span>
            {activeAlert.moisture !== undefined && (
              <span className="font-mono text-sm text-blue-400">{activeAlert.moisture}% H₂O</span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleDismiss}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-700"
          >
            Dismiss
          </button>
          <button 
            onClick={handleView}
            className={`flex-[2] py-2 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 ${isCritical ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
          >
            <span>View Location</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
