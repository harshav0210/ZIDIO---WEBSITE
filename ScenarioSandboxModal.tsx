import React from 'react';
import { SKU, ScenarioParams, InventoryOptimizationMetrics } from '../types/inventory';
import { X, SlidersHorizontal, AlertTriangle, TrendingUp, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';

interface ScenarioSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioParams;
  onUpdateScenario: (newParams: ScenarioParams) => void;
  onResetScenario: () => void;
  skus: SKU[];
  optimizations: Record<string, InventoryOptimizationMetrics>;
}

export const ScenarioSandboxModal: React.FC<ScenarioSandboxModalProps> = ({
  isOpen,
  onClose,
  scenario,
  onUpdateScenario,
  onResetScenario,
  skus,
  optimizations,
}) => {
  if (!isOpen) return null;

  // Compute how many SKUs are in stockout risk under this scenario
  const stockoutRiskCount = skus.filter((s) => {
    const opt = optimizations[s.id];
    return opt?.status === 'stockout_risk';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">What-If Supply &amp; Demand Sandbox</h3>
              <p className="text-xs text-slate-500">
                Stress-test network inventory resilience against disruptions and promotional surges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-4 text-xs">
          {/* Demand Shock */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Macro Demand Shock (% Shift)</span>
              <span className="font-mono font-bold text-sm text-indigo-700">
                {scenario.demandShockPct > 0 ? `+${scenario.demandShockPct}%` : `${scenario.demandShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="60"
              step="5"
              value={scenario.demandShockPct}
              onChange={(e) =>
                onUpdateScenario({ ...scenario, demandShockPct: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-40% Recession</span>
              <span>0% Baseline</span>
              <span>+60% Viral Surge</span>
            </div>
          </div>

          {/* Supplier Lead Time Delay */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Global Supplier Lead-Time Delay</span>
              <span className="font-mono font-bold text-sm text-amber-700">
                +{scenario.supplierDelayDays} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              value={scenario.supplierDelayDays}
              onChange={(e) =>
                onUpdateScenario({ ...scenario, supplierDelayDays: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0d Normal Operations</span>
              <span>+7d Port Congestion</span>
              <span>+14d Severe Bottleneck</span>
            </div>
          </div>

          {/* Quick Scenario Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Flash Promo Surge</span>
                <span className="text-[10px] text-slate-500">+35% temporary lift</span>
              </div>
              <input
                type="checkbox"
                checked={scenario.promotionActive}
                onChange={(e) =>
                  onUpdateScenario({ ...scenario, promotionActive: e.target.checked })
                }
                className="rounded-xs text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Holiday Shopping Peak</span>
                <span className="text-[10px] text-slate-500">+40% seasonal lift</span>
              </div>
              <input
                type="checkbox"
                checked={scenario.holidaySurge}
                onChange={(e) =>
                  onUpdateScenario({ ...scenario, holidaySurge: e.target.checked })
                }
                className="rounded-xs text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Live Network Impact Assessment */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
          <div className="flex items-center justify-between text-indigo-300 font-semibold text-[11px] uppercase tracking-wider">
            <span>Simulated Network Outcome</span>
            <span>Live Recalculation</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono pt-1">
            <div className="p-2 rounded-lg bg-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Stockout Risk Horizon:</span>
              <strong className={`text-base ${stockoutRiskCount > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stockoutRiskCount} SKUs Critical
              </strong>
            </div>

            <div className="p-2 rounded-lg bg-slate-800">
              <span className="text-slate-400 text-[10px] block font-sans">Safety Buffer Impact:</span>
              <strong className="text-base text-amber-300">
                {scenario.supplierDelayDays > 0 ? `+${scenario.supplierDelayDays * 12}% buffer` : 'Standard Buffer'}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onResetScenario}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            Apply Simulation &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
