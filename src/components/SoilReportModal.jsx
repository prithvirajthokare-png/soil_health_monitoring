import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/report-print.css';
import {
  X,
  Printer,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Activity,
  Droplets,
  Thermometer,
  TestTube,
  Gauge,
  Leaf,
  Zap,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Sprout
} from 'lucide-react';
import { fetchSoilHealthReport, fetchIrrigationPrediction } from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────

function statusColor(status) {
  switch (status) {
    case 'optimal': return 'text-emerald-400';
    case 'warning': return 'text-yellow-400';
    case 'critical': return 'text-red-400';
    case 'deficient': return 'text-orange-400';
    case 'excess': return 'text-purple-400';
    default: return 'text-slate-400';
  }
}

function urgencyBadge(urgency) {
  switch (urgency) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    case 'normal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    default: return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  }
}

function healthScoreColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function scoreArc(score) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return { r, circ, fill };
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const { r, circ, fill } = scoreArc(score);
  return (
    <svg width="96" height="96" className="print:w-20 print:h-20">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={score >= 80 ? '#34d399' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'}
        strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="44" textAnchor="middle" fontSize="18" fontWeight="bold" fill={score >= 80 ? '#34d399' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'} className="font-mono">
        {score}
      </text>
      <text x="48" y="58" textAnchor="middle" fontSize="9" fill="#94a3b8">
        / 100
      </text>
    </svg>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300 print:rounded-none print:border-0 print:border-t">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900/70 hover:bg-slate-800/70 transition-colors print:pointer-events-none print:bg-white"
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 print:text-slate-900">
          {Icon && <Icon className="w-4 h-4 text-emerald-400 print:text-slate-700" />}
          <span>{title}</span>
        </div>
        <span className="print:hidden">
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-950/50 print:bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function MetricRow({ metric }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 py-3 border-b border-slate-800/60 last:border-0 print:border-slate-200">
      <div className="flex items-center gap-2 sm:w-44 shrink-0">
        <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor(metric.status)} bg-current/10 border-current/20`}>
          {metric.status_label || metric.status}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-slate-200 print:text-slate-900">{metric.metric}</span>
          <span className="font-mono text-base font-bold text-slate-100 print:text-slate-900">
            {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
            <span className="text-slate-400 text-xs ml-1">{metric.unit}</span>
          </span>
          {metric.target && (
            <span className="text-xs text-slate-500">target: {metric.target}</span>
          )}
        </div>
        {metric.interpretation && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed print:text-slate-600">
            {metric.interpretation}
          </p>
        )}
      </div>
    </div>
  );
}

function PriorityTag({ urgency }) {
  const labels = { immediate: 'Immediate', scheduled: 'Scheduled', routine: 'Routine' };
  const colors = {
    immediate: 'bg-red-500/15 text-red-400 border-red-500/30',
    scheduled: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    routine: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  };
  return (
    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${colors[urgency] || colors.routine}`}>
      {labels[urgency] || urgency}
    </span>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export default function SoilReportModal({ locationId, locationName, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const printRef = useRef(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSoilHealthReport(locationId);
      setReport(data);
      setGeneratedAt(data?.generated_at ? new Date(data.generated_at) : new Date());
    } catch (err) {
      setError('Failed to generate report. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const content = printRef.current.cloneNode(true);

      // Remove non-printable action buttons
      const nonPrintElements = content.querySelectorAll('button, .print\\:hidden, .no-print');
      nonPrintElements.forEach(el => el.remove());

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Soil Health Report - ${locationName || locationId}</title>
            <style>
              @page { margin: 12mm; size: A4 portrait; }
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                margin: 0;
                padding: 16px;
                font-size: 13px;
                line-height: 1.5;
              }
              h1, h2, h3, h4 { color: #0f172a; margin-top: 0; }
              .p-5, .p-4 { padding: 16px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
              .text-slate-100, .text-slate-200, .text-slate-300, .text-white { color: #0f172a !important; }
              .text-slate-400, .text-slate-500 { color: #475569 !important; }
              .text-emerald-400, .text-emerald-500, .text-emerald-600 { color: #047857 !important; }
              .text-cyan-400, .text-cyan-300 { color: #0e7490 !important; }
              .text-amber-400, .text-amber-500 { color: #b45309 !important; }
              .text-rose-400, .text-rose-500 { color: #be123c !important; }
              .bg-slate-900, .bg-slate-950, .bg-slate-900\\/80, .bg-slate-950\\/60, .bg-slate-800 {
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
              }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
              td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; }
              .rounded-full { border-radius: 9999px; }
              .rounded-xl, .rounded-2xl { border-radius: 10px; }
              button, .print\\:hidden, .no-print { display: none !important; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    } catch (err) {
      console.error('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  };

  const summary = report?.executive_summary;
  const meta = report?.meta;
  const score = meta?.health_score ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto print:bg-transparent print:p-0 print:static print:overflow-visible"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          id="soil-report-print-root"
          ref={printRef}
          className="printable-report w-full max-w-3xl my-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden print:max-w-full print:my-0 print:rounded-none print:border-0 print:bg-white print:shadow-none print:overflow-visible"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Sprout className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 print:text-slate-900">
                  {loading ? 'Generating Report…' : (summary?.headline || `Soil Health Report`)}
                </h2>
                <p className="text-xs text-slate-500 print:text-slate-500">
                  {generatedAt && `Generated ${generatedAt.toLocaleString()}`}
                  {meta?.report_engine && (
                    <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 print:hidden">
                      {meta.report_engine}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={loadReport}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Regenerate report"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                title="Print / Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible">

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                </div>
                <p className="text-slate-400 text-sm animate-pulse">Analyzing soil data and generating report…</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Report generation failed</p>
                  <p className="text-xs text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {report && !loading && (
              <>
                {/* ── Executive Summary ── */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 print:bg-white print:border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Score Ring */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <ScoreRing score={score} />
                      <span className={`text-xs font-bold ${healthScoreColor(score)}`}>
                        {meta?.health_status || 'Unknown'}
                      </span>
                    </div>

                    {/* Narrative */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {meta?.location_id}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {meta?.current_crop?.toUpperCase()}
                        </span>
                        {meta?.soil_type && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {meta.soil_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed print:text-slate-700">
                        {summary?.health_narrative}
                      </p>
                      <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${urgencyBadge(report?.irrigation_forecast?.urgency)}`}>
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{summary?.irrigation_note}</span>
                      </div>
                    </div>
                  </div>

                  {/* Critical Issues */}
                  {summary?.critical_issues?.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Issues Detected</p>
                      {summary.critical_issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-orange-300 print:text-orange-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Positive Findings */}
                  {summary?.positive_findings?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Optimal Parameters</p>
                      <div className="flex flex-wrap gap-2">
                        {summary.positive_findings.map((f, i) => (
                          <span key={i} className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />{f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Soil Metrics ── */}
                {report.metrics?.length > 0 && (
                  <CollapsibleSection title="Soil Metrics Breakdown" icon={Activity}>
                    {report.metrics.map((m, i) => <MetricRow key={i} metric={m} />)}
                  </CollapsibleSection>
                )}

                {/* ── Irrigation Forecast ── */}
                {report.irrigation_forecast && (
                  <CollapsibleSection title="Irrigation Forecast" icon={Droplets}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                        <p className="text-[10px] uppercase text-slate-500 font-semibold">Current VWC</p>
                        <p className="text-xl font-mono font-bold text-slate-100">
                          {report.irrigation_forecast.current_moisture?.toFixed(1) ?? '—'}
                          <span className="text-xs text-slate-400 ml-1">%</span>
                        </p>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                        <p className="text-[10px] uppercase text-slate-500 font-semibold">Trigger At</p>
                        <p className="text-xl font-mono font-bold text-slate-100">
                          {report.irrigation_forecast.trigger_threshold?.toFixed(0) ?? '—'}
                          <span className="text-xs text-slate-400 ml-1">%</span>
                        </p>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                        <p className="text-[10px] uppercase text-slate-500 font-semibold">Drying Rate</p>
                        <p className="text-xl font-mono font-bold text-slate-100">
                          {report.irrigation_forecast.slope_pct_per_hour != null
                            ? `${Math.abs(report.irrigation_forecast.slope_pct_per_hour).toFixed(3)}`
                            : '—'}
                          <span className="text-xs text-slate-400 ml-1">%/hr</span>
                        </p>
                      </div>
                      <div className={`rounded-lg p-3 border ${urgencyBadge(report.irrigation_forecast.urgency)}`}>
                        <p className="text-[10px] uppercase font-semibold opacity-70">Forecast</p>
                        <p className="text-xl font-mono font-bold">
                          {report.irrigation_forecast.predicted_hours_to_trigger != null
                            ? `${report.irrigation_forecast.predicted_hours_to_trigger}h`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed print:text-slate-700">
                      {report.irrigation_forecast.forecast_message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      {report.irrigation_forecast.methodology}
                    </p>
                  </CollapsibleSection>
                )}

                {/* ── Nutrient Analysis ── */}
                {report.nutrient_analysis?.available && (
                  <CollapsibleSection title="Macronutrient Analysis (NPK)" icon={Leaf}>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {['nitrogen', 'phosphorus', 'potassium'].map(n => {
                        const nutrient = report.nutrient_analysis[n];
                        return (
                          <div key={n} className={`rounded-lg p-3 border ${statusColor(nutrient.status)} bg-current/5 border-current/20`}>
                            <p className="text-[10px] uppercase font-semibold opacity-70 capitalize">{n}</p>
                            <p className="text-2xl font-mono font-bold">{nutrient.value?.toFixed(1)}</p>
                            <p className="text-[10px] opacity-60">mg/kg • target {nutrient.target}</p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{report.nutrient_analysis.balance_summary}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">NPK Ratio: {report.nutrient_analysis.npk_ratio}</p>
                  </CollapsibleSection>
                )}

                {/* ── Recommendations ── */}
                {report.recommendations?.length > 0 && (
                  <CollapsibleSection title="Prioritized Recommendations" icon={Zap}>
                    <div className="space-y-3">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800/60 last:border-0">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold shrink-0 mt-0.5">
                            {rec.priority}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500">{rec.category}</span>
                              <PriorityTag urgency={rec.urgency} />
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed print:text-slate-700">{rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* ── Action Plan ── */}
                {report.action_plan?.length > 0 && (
                  <CollapsibleSection title="7-Day Action Plan" icon={Calendar}>
                    <div className="space-y-4">
                      {report.action_plan.map((step, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">{step.timeframe}</span>
                          </div>
                          <ul className="space-y-1.5 ml-6">
                            {step.actions.map((action, j) => (
                              <li key={j} className="text-sm text-slate-300 flex items-start gap-2 print:text-slate-700">
                                <span className="text-emerald-500 mt-1 shrink-0">›</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Footer */}
                <div className="text-center text-[10px] text-slate-600 pt-2 pb-1 print:text-slate-400">
                  TerraPulse v2.0 · AI Soil Health Report · {generatedAt?.toLocaleString()} · Engine: {meta?.report_engine || 'rule-based'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
