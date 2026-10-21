import React, { useEffect, useState } from 'react';
import { Brain, Play, Pause, ChevronRight, X, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  { 
    id: 'dashboard', 
    tab: 'dashboard', 
    title: '1. AI Agronomic Intelligence & Health Dashboard',
    desc: 'Real-time composite health indices, machine learning confidence scores, and crop matrix.'
  },
  { 
    id: 'ai-insights', 
    tab: 'ai-insights', 
    title: '2. Explainable AI (XAI) & Crop Suitability Simulator',
    desc: 'Interactive crop selector, SHAP feature attributions, and predictive irrigation decay models.'
  },
  { 
    id: 'map', 
    tab: 'map', 
    title: '3. Precision Agricultural GIS & Satellite Mapping',
    desc: 'Spatial polygon field boundaries, node telemetry coordinates, and sensor status overlays.'
  },
  { 
    id: 'locations', 
    tab: 'locations', 
    title: '4. Farm Registry & Micro-Climate Sites',
    desc: 'Centralized directory of monitored fields across multiple agricultural districts.'
  },
  { 
    id: 'alerts', 
    tab: 'alerts', 
    title: '5. Real-Time Telemetry & Threshold Alerts',
    desc: 'Automated anomaly detection for rootzone moisture deficit, nitrogen exhaustion, and salinity.'
  }
];

export default function DemoTour({ activeTab, setActiveTab, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 6 seconds if not paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setStepIdx(i => {
        const next = (i + 1) % TOUR_STEPS.length;
        setActiveTab(TOUR_STEPS[next].tab);
        return next;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, setActiveTab]);

  const handleNext = () => {
    setStepIdx(i => {
      const next = (i + 1) % TOUR_STEPS.length;
      setActiveTab(TOUR_STEPS[next].tab);
      return next;
    });
  };

  const currentStep = TOUR_STEPS[stepIdx];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl transition-all">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-4 shadow-2xl ring-1 ring-emerald-400/30 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950 shrink-0">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tour Step {stepIdx + 1} of {TOUR_STEPS.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Auto-advances in 6s
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100 mt-0.5">
              {currentStep.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-sm mt-0.5">
              {currentStep.desc}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title={isPaused ? 'Resume auto-play' : 'Pause tour'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
            title="Next tour step"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 transition-colors"
            title="Exit tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
