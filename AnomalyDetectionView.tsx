import React, { useState } from 'react';
import { AnomalyAlert, SKU } from '../types/inventory';
import {
  Flame,
  AlertTriangle,
  RotateCcw,
  Clock,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AnomalyDetectionViewProps {
  alerts: AnomalyAlert[];
  skus: SKU[];
  onTakeAction: (alertId: string, actionType: string) => void;
  onSelectSku: (skuId: string) => void;
  onOpenNewPO: (skuId: string) => void;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({
  alerts,
  skus,
  onTakeAction,
  onSelectSku,
  onOpenNewPO,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const handleResolve = (alert: AnomalyAlert) => {
    setResolvedIds((prev) => new Set([...prev, alert.id]));
    if (alert.type === 'spike') {
      onOpenNewPO(alert.skuId);
    }
  };

  const getSeverityBadge = (sev: 'high' | 'medium' | 'low') => {
    if (sev === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
          High Severity
        </span>
      );
    }
    if (sev === 'medium') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
          Medium Severity
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
        Low Severity
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'dead_stock':
        return <RotateCcw className="w-5 h-5 text-purple-600" />;
      case 'lead_time_drift':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'seasonal_shift':
        return <TrendingUp className="w-5 h-5 text-indigo-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div id="anomaly-detection-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Anomaly &amp; Outlier Detection Radar</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-medium">
                  Statistical + Isolation Forest
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated detection of sudden demand spikes, dead inventory accumulation, and supplier lead-time drift
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {[
              { id: 'all', label: 'All Anomalies' },
              { id: 'spike', label: 'Demand Spikes' },
              { id: 'dead_stock', label: 'Dead Stock' },
              { id: 'lead_time_drift', label: 'Lead Time Drifts' },
              { id: 'seasonal_shift', label: 'Seasonal Shifts' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomaly Cards Grid */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isResolved = resolvedIds.has(alert.id);

          return (
            <div
              key={alert.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                isResolved
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : alert.severity === 'high'
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left: Icon & Details */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                    {getTypeIcon(alert.type)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                      <span className="text-xs text-slate-400 font-mono">
                        Isolation Score: <strong>{alert.score}/100</strong>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      <span className="text-slate-900 font-bold">{alert.skuName}</span> ({alert.skuCode}) at{' '}
                      <span className="text-slate-800 font-semibold">{alert.locationName}</span>
                    </div>

                    {/* Root cause diagnostics */}
                    <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-lg max-w-3xl">
                      <span className="font-semibold text-slate-900">Root-Cause Analysis: </span>
                      {alert.rootCause}
                    </div>

                    {/* Metric deviations */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                      <div className="font-mono text-slate-700">
                        Observed: <strong className="text-slate-900">{alert.metricValue}</strong>
                      </div>
                      <div className="font-mono text-slate-500">
                        Statistical Boundary: <span>{alert.threshold}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Detected: {alert.date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Recommended Mitigation & Actions */}
                <div className="lg:w-80 shrink-0 flex flex-col justify-between bg-slate-50/80 border border-slate-200 rounded-lg p-3 text-xs space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                      Recommended Mitigation
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {alert.recommendedAction}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Action Executed
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleResolve(alert)}
                          className="flex-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors text-center"
                        >
                          {alert.type === 'spike'
                            ? 'Trigger Emergency PO'
                            : alert.type === 'dead_stock'
                            ? 'Run Markdown Campaign'
                            : 'Adjust Safety Stock'}
                        </button>
                        <button
                          onClick={() => onSelectSku(alert.skuId)}
                          className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-200 text-slate-700"
                          title="Inspect in Optimization View"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
