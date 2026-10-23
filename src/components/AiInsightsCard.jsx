import React, { useEffect, useState, useMemo } from 'react';
import Card from './Card';
import { fetchIrrigationPrediction, fetchSoilHealthReport } from '../services/api';
import { runAiCropDiagnostic, SUPPORTED_CROPS } from '../data/cropIntelligence';
import { Brain, Sparkles, TrendingUp, Droplets, ChevronRight, Cpu } from 'lucide-react';

/**
 * AI Insights Card displayed on the main dashboard.
 * Clearly communicates AI-driven machine learning evaluation, confidence rating,
 * and dynamic crop suitability.
 */
export default function AiInsightsCard({ locationData, latestReading, setActiveTab }) {
  const [selectedCropId, setSelectedCropId] = useState('general');
  const [prediction, setPrediction] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const locId = locationData?.id || 'LOC_001';

  // Automatically adapt to the location's current crop if specified
  useEffect(() => {
    const cropRaw = locationData?.current_crop || locationData?.crop;
    if (cropRaw && typeof cropRaw === 'string') {
      const match = cropRaw.toLowerCase();
      const found = SUPPORTED_CROPS.find(c => match.includes(c.id) || c.name.toLowerCase().includes(match));
      if (found) setSelectedCropId(found.id);
    }
  }, [locationData]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pred, rep] = await Promise.all([
          fetchIrrigationPrediction(locId),
          fetchSoilHealthReport(locId),
        ]);
        setPrediction(pred);
        setReport(rep);
      } catch (e) {
        console.warn('AI card fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [locId]);

  // Compute real-time AI Crop Diagnostic based on live telemetry readings
  const aiDiagnostic = useMemo(() => {
    return runAiCropDiagnostic(selectedCropId, latestReading || {});
  }, [selectedCropId, latestReading]);

  return (
    <div 
      onClick={() => setActiveTab && setActiveTab('ai-insights')}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 p-5 shadow-xl hover:shadow-2xl hover:border-emerald-400/60 transition-all cursor-pointer group"
      title="Click to open comprehensive Explainable AI diagnostics"
    >
      {/* Background AI ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Smart Soil AI Assistant
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">
              Soil Health & Moisture Prediction
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 font-mono">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span>High Accuracy</span>
        </div>
      </div>

      {/* Main Diagnostic Body */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        {/* Suitability Score */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Crop Suitability
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-3xl font-extrabold ${aiDiagnostic.scoreColor}`}>
              {aiDiagnostic.score}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {aiDiagnostic.scoreRating}
          </div>
        </div>

        {/* Selected Crop Indicator */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Selected Crop
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg">{aiDiagnostic.crop.icon}</span>
            <span className="text-sm font-bold text-slate-200 truncate">
              {aiDiagnostic.crop.name.split(' ')[0]}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Stage: {aiDiagnostic.stage}
          </div>
        </div>

        {/* Predictive Irrigation Horizon */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Watering Estimate</span>
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            ~{aiDiagnostic.irrigation.hoursToTrigger} hrs
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Until soil reaches {aiDiagnostic.irrigation.triggerPct}% moisture
          </div>
        </div>
      </div>

      {/* AI Action Prescription Snippet */}
      <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-[11px] leading-relaxed line-clamp-2 text-slate-300">
          <span className="font-semibold text-emerald-300">AI Advice: </span>
          {aiDiagnostic.prescriptions[0]?.action || aiDiagnostic.irrigation.advice}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {/* Footer hint */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Continuous Soil Monitoring
        </span>
        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
          View Detailed AI Analysis &rarr;
        </span>
      </div>
    </div>
  );
}
