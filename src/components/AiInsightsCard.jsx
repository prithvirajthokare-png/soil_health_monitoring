import React, { useEffect, useState } from 'react';
import Card from './Card';
import { fetchIrrigationPrediction, fetchSoilHealthReport } from '../services/api';
import { Loader2 } from 'lucide-react';

/**
 * AI Insights Card displayed on the main dashboard.
 * Shows a concise health score, confidence badge, and a short recommendation.
 * Clicking the card navigates to the detailed Explainable AI panel (setActiveTab('ai-insights')).
 */
export default function AiInsightsCard({ locationId, setActiveTab }) {
  const [prediction, setPrediction] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pred, rep] = await Promise.all([
        fetchIrrigationPrediction(locationId),
        fetchSoilHealthReport(locationId),
      ]);
      setPrediction(pred);
      setReport(rep);
      setLoading(false);
    }
    load();
  }, [locationId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center space-x-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading AI insights…</span>
        </div>
      </Card>
    );
  }

  const healthScore = report?.meta?.health_score ?? '--';
  const healthStatus = report?.meta?.health_status ?? '';
  const confidence = prediction?.confidence ?? 'unknown';
  const confidenceColor =
    confidence === 'high' ? 'bg-emerald-500' :
    confidence === 'medium' ? 'bg-amber-500' :
    confidence === 'low' ? 'bg-rose-500' : 'bg-gray-500';
  const recommendation = report?.executive_summary?.irrigation_note ?? '';

  return (
    <Card
      title="AI Insights"
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setActiveTab('ai-insights')}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Health Score</div>
          <div className="text-3xl font-bold text-brand-700">{healthScore}</div>
          <div className="text-sm text-slate-400">{healthStatus}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceColor} text-white`}>Confidence: {confidence}</div>
          <div className="mt-2 text-xs text-slate-500 text-right">{recommendation}</div>
        </div>
      </div>
    </Card>
  );
}
