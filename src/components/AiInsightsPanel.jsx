import React, { useEffect, useState } from 'react';
import Card from './Card';
import { fetchIrrigationPrediction, fetchSoilHealthReport } from '../services/api';
import { Loader2 } from 'lucide-react';

/**
 * Detailed Explainable AI panel.
 * Shows the full AI report, prediction details, and (if available) feature importance.
 */
export default function AiInsightsPanel({ locationId }) {
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
          <span>Loading AI details…</span>
        </div>
      </Card>
    );
  }

  if (!report) {
    return <div className="p-4 text-slate-400">No AI report available.</div>;
  }

  const { meta, executive_summary, metrics, recommendations } = report;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card title="AI Summary">
        <div className="space-y-3">
          <p className="text-sm text-slate-200">{executive_summary?.health_narrative}</p>
          <p className="text-sm text-slate-400">{executive_summary?.irrigation_note}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-medium">Score: {meta?.health_score}</div>
            <div className="px-2 py-0.5 rounded bg-emerald-500 text-white text-xs font-medium">Status: {meta?.health_status}</div>
            {prediction && (
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                prediction.confidence === 'high' ? 'bg-emerald-500' :
                prediction.confidence === 'medium' ? 'bg-amber-500' :
                prediction.confidence === 'low' ? 'bg-rose-500' : 'bg-gray-500'
              } text-white`}>Confidence: {prediction.confidence}</div>
            )}
          </div>
        </div>
      </Card>

      {/* Metrics Table */}
      <Card title="Key Metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics && metrics.map((m, i) => (
                <tr key={i} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-1.5 text-slate-300 font-medium">{m.metric}</td>
                  <td className="py-1.5 text-slate-200">{m.value} {m.unit}</td>
                  <td className="py-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      m.status === 'optimal' ? 'bg-emerald-600 text-white' :
                      m.status === 'warning' ? 'bg-amber-600 text-white' :
                      m.status === 'critical' ? 'bg-rose-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>{m.status_label || m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card title="Recommendations">
          <ul className="list-disc list-inside space-y-1 text-slate-200 text-sm">
            {recommendations.map((r, i) => (
              <li key={i}>{r.action || r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
