import React from 'react';
import { POLICY_EVALUATION_BENCHMARKS } from '../data/mockDatasets';
import {
  GitCompare,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  PieChart,
  CheckCircle2,
  BarChart,
  Sparkles,
} from 'lucide-react';

export const PolicySimulatorView: React.FC = () => {
  // Simulated 12-week cost curve comparison
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const naiveCumulativeCosts = [14200, 29100, 44800, 61200, 77900, 95100, 112400, 130200, 148100, 166500, 185200, 204500];
  const mlCumulativeCosts = [11100, 22400, 34100, 46000, 58200, 70600, 83100, 95900, 108800, 121900, 135200, 148700];

  const totalCostDiff = naiveCumulativeCosts[11] - mlCumulativeCosts[11];
  const pctSavings = Math.round((totalCostDiff / naiveCumulativeCosts[11]) * 100);

  return (
    <div id="policy-simulator-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <GitCompare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Policy Evaluation &amp; Backtest Benchmark</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium">
                  12-Week Empirical Backtest
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Quantitative comparison: Baseline "No-Forecast / Static Rule" Policy vs. "AI-Powered ML + Dynamic ROP"
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-800">
            <span>Cumulative 12-Week Efficiency Gain: </span>
            <strong className="text-sm font-bold text-emerald-900 font-mono">
              +${totalCostDiff.toLocaleString()} ({pctSavings}% savings)
            </strong>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Impact Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stockout Rate Reduction</span>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">-83.1%</div>
          <div className="text-xs text-slate-500 mt-1">
            Dropped from 14.2% down to 2.4% order stockout frequency.
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Carrying Cost Reduction</span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">-$44,600 / yr</div>
          <div className="text-xs text-slate-500 mt-1">
            Eliminated excess safety buffers on low-variability goods.
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Forecast Error (MAPE)</span>
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono">5.8% vs 21.8%</div>
          <div className="text-xs text-slate-500 mt-1">
            TFT + Prophet ensemble outperformed naive 30-day moving averages by 73.4%.
          </div>
        </div>
      </div>

      {/* Side-by-Side Evaluation Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Policy Evaluation Metrics Scorecard</h3>
          <p className="text-xs text-slate-500">
            Standard supply chain operational benchmarks evaluated over a simulated 12-week historical retail cycle
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-3">Naive / Rule-of-Thumb Policy</th>
                <th className="py-3 px-3">ML-Powered Dynamic Policy</th>
                <th className="py-3 px-3">Net Impact</th>
                <th className="py-3 px-4">Mechanistic Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {POLICY_EVALUATION_BENCHMARKS.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                    {row.metric}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{row.naivePolicyValue}</td>
                  <td className="py-3.5 px-3 text-indigo-700 font-bold">{row.mlPolicyValue}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {row.improvement}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] max-w-xs">
                    {row.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12-Week Cumulative Cost Curve Visualization */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cumulative Network Operating Cost (12 Weeks)</h3>
            <p className="text-xs text-slate-500">
              Holding costs + stockout lost margins + ordering setup overhead over time
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
              <span className="text-slate-600">Naive Policy ($204.5k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 inline-block"></span>
              <span className="font-semibold text-indigo-700">ML-Optimized ($148.7k)</span>
            </div>
          </div>
        </div>

        {/* Mini SVG comparison chart */}
        <div className="w-full h-44">
          <svg viewBox="0 0 600 150" className="w-full h-full select-none">
            {/* Grid lines */}
            <line x1="30" y1="20" x2="580" y2="20" stroke="#f1f5f9" />
            <line x1="30" y1="60" x2="580" y2="60" stroke="#f1f5f9" />
            <line x1="30" y1="100" x2="580" y2="100" stroke="#f1f5f9" />
            <line x1="30" y1="130" x2="580" y2="130" stroke="#e2e8f0" />

            {/* Path for Naive */}
            <path
              d={naiveCumulativeCosts
                .map((c, i) => `${i === 0 ? 'M' : 'L'} ${30 + (i / 11) * 550},${130 - (c / 220000) * 110}`)
                .join(' ')}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4,3"
            />

            {/* Path for ML */}
            <path
              d={mlCumulativeCosts
                .map((c, i) => `${i === 0 ? 'M' : 'L'} ${30 + (i / 11) * 550},${130 - (c / 220000) * 110}`)
                .join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
            />

            {/* Week labels */}
            {weeks.map((w, i) => (
              <text
                key={w}
                x={30 + (i / 11) * 550}
                y="144"
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-mono"
              >
                W{w}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
