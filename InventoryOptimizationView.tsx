import React, { useState, useMemo } from 'react';
import { SKU } from '../types/inventory';
import { calculateOptimization, getZScore, formatINR } from '../utils/inventoryCalculations';
import { StockDepletionChart } from './charts/StockDepletionChart';
import {
  Calculator,
  Shield,
  Truck,
  RotateCw,
  Package,
  ArrowRight,
  TrendingDown,
  Info,
  IndianRupee,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface InventoryOptimizationViewProps {
  skus: SKU[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  onOpenNewPO: (skuId: string, quantity?: number) => void;
}

export const InventoryOptimizationView: React.FC<InventoryOptimizationViewProps> = ({
  skus,
  selectedSkuId,
  onSelectSkuId,
  onOpenNewPO,
}) => {
  const currentSku = skus.find((s) => s.id === selectedSkuId) || skus[0];

  // Interactive parameter overrides
  const [serviceLevel, setServiceLevel] = useState<number>(currentSku.targetServiceLevel);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(currentSku.supplierLeadTimeDays);
  const [orderSetupCost, setOrderSetupCost] = useState<number>(currentSku.orderSetupCost);
  const [holdingRate, setHoldingRate] = useState<number>(currentSku.holdingCostAnnualRate);
  const [simulateReplenishment, setSimulateReplenishment] = useState<boolean>(true);

  // Sync state when SKU changes
  const handleSkuChange = (newSkuId: string) => {
    onSelectSkuId(newSkuId);
    const found = skus.find((s) => s.id === newSkuId);
    if (found) {
      setServiceLevel(found.targetServiceLevel);
      setLeadTimeDays(found.supplierLeadTimeDays);
      setOrderSetupCost(found.orderSetupCost);
      setHoldingRate(found.holdingCostAnnualRate);
    }
  };

  // Re-calculate optimization in real time
  const opt = useMemo(() => {
    return calculateOptimization(currentSku, {
      serviceLevel,
      leadTimeDays,
      orderSetupCost,
      holdingCostRate: holdingRate,
    });
  }, [currentSku, serviceLevel, leadTimeDays, orderSetupCost, holdingRate]);

  const zScore = getZScore(serviceLevel);
  const unitHoldingCost = (currentSku.unitCost * holdingRate).toFixed(2);

  return (
    <div id="inventory-optimization-view" className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Inventory Optimization Engine (इन्वेंट्री संतुलन)</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-blue-700 font-semibold border border-sky-150">
                  Desh Hybrid Mathematical Solver
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Economic Order Quantity (EOQ), stochastic Safety Stock buffers, &amp; dynamic Reorder Points (ROP) calculated in ₹ INR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sku-opt-picker" className="text-xs font-semibold text-slate-700">
              Select Product:
            </label>
            <select
              id="sku-opt-picker"
              value={selectedSkuId}
              onChange={(e) => handleSkuChange(e.target.value)}
              className="bg-sky-50/50 border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.skuCode} — {s.name} ({s.locationName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Left Controls & Formulas, Right Chart & Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Optimization Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Optimization Parameter Sliders
              </h3>
              <button
                onClick={() => {
                  setServiceLevel(currentSku.targetServiceLevel);
                  setLeadTimeDays(currentSku.supplierLeadTimeDays);
                  setOrderSetupCost(currentSku.orderSetupCost);
                  setHoldingRate(currentSku.holdingCostAnnualRate);
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Target Service Level */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Target Service Level (Fill Rate)
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  {(serviceLevel * 100).toFixed(1)}% (Z = {zScore})
                </span>
              </div>
              <input
                type="range"
                min="0.85"
                max="0.995"
                step="0.005"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>85% (Z=1.04)</span>
                <span>95% (Z=1.65)</span>
                <span>98% (Z=2.05)</span>
                <span>99.5% (Z=2.58)</span>
              </div>
            </div>

            {/* Supplier Lead Time */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Supplier Highway Lead Time
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  {leadTimeDays} days (±{currentSku.leadTimeStdDevDays}d σ)
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="35"
                step="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value))}
                className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>3 days (Express Corridor)</span>
                <span>14 days (Inter-State Hub)</span>
                <span>35 days (Port Import)</span>
              </div>
            </div>

            {/* Order Setup Cost (S) */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-blue-600" /> Order Setup / Admin Cost (S)
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  ₹{orderSetupCost.toLocaleString('en-IN')} / order
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={orderSetupCost}
                onChange={(e) => setOrderSetupCost(parseInt(e.target.value))}
                className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] text-slate-400">PO issuance, GST verification, and dock unloading cost</span>
            </div>

            {/* Holding Cost Rate (H) */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-600" /> Annual Holding Cost Rate
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  {(holdingRate * 100).toFixed(0)}% (₹{unitHoldingCost}/unit/yr)
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.35"
                step="0.01"
                value={holdingRate}
                onChange={(e) => setHoldingRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] text-slate-400">Working capital financing + warehouse rent + shrinkage</span>
            </div>
          </div>

          {/* Mathematical Formula Breakdown Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-xs text-xs font-mono space-y-3">
            <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-[11px] border-b border-slate-800 pb-1.5">
              <span>Operations Research Derivation</span>
              <span className="text-sky-400">Live Mathematical Proof (₹)</span>
            </div>

            {/* EOQ formula */}
            <div>
              <div className="text-sky-300 text-[11px] font-bold">1. Economic Order Quantity (EOQ):</div>
              <div className="text-slate-400 text-[10px]">EOQ = √((2 · D · S) / H)</div>
              <div className="text-white mt-0.5">
                = √((2 · {opt.annualDemand} · ₹{orderSetupCost}) / ₹{unitHoldingCost}) = <strong className="text-emerald-400">{opt.eoq} units</strong>
              </div>
            </div>

            {/* Safety Stock formula */}
            <div>
              <div className="text-sky-300 text-[11px] font-bold">2. Dynamic Safety Stock (SS):</div>
              <div className="text-slate-400 text-[10px]">SS = Z · √(L · σ_D² + D² · σ_L²)</div>
              <div className="text-white mt-0.5">
                = {zScore} · √({leadTimeDays} · {opt.dailyDemandStdDev}² + {opt.dailyDemandAvg}² · {currentSku.leadTimeStdDevDays}²) = <strong className="text-rose-400">{opt.safetyStock} units</strong>
              </div>
            </div>

            {/* ROP formula */}
            <div>
              <div className="text-sky-300 text-[11px] font-bold">3. Reorder Point (ROP):</div>
              <div className="text-slate-400 text-[10px]">ROP = (Lead Time Demand) + Safety Stock</div>
              <div className="text-white mt-0.5">
                = ({opt.dailyDemandAvg} · {leadTimeDays}d) + {opt.safetyStock} = <strong className="text-amber-400">{opt.reorderPoint} units</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Outputs, Actions, and Depletion Horizon (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Optimization Output Summary Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Reorder Point (ROP)</span>
              <div className="text-xl font-bold text-amber-700 font-mono mt-1">
                {opt.reorderPoint}
              </div>
              <span className="text-[10px] text-slate-400">Trigger threshold</span>
            </div>

            <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Safety Stock</span>
              <div className="text-xl font-bold text-rose-600 font-mono mt-1">
                {opt.safetyStock}
              </div>
              <span className="text-[10px] text-slate-400">Buffer at {(serviceLevel * 100).toFixed(0)}% fill</span>
            </div>

            <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Batch Size (EOQ)</span>
              <div className="text-xl font-bold text-blue-700 font-mono mt-1">
                {opt.eoq}
              </div>
              <span className="text-[10px] text-slate-400">Min cost order size</span>
            </div>

            <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Current Runway</span>
              <div className={`text-xl font-bold font-mono mt-1 ${opt.daysOfSupply < 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {opt.daysOfSupply} d
              </div>
              <span className="text-[10px] text-slate-400">{currentSku.currentStock} on hand</span>
            </div>
          </div>

          {/* Action Recommendation Banner */}
          <div className={`border rounded-xl p-4 shadow-xs ${
            opt.status === 'stockout_risk'
              ? 'bg-rose-50 border-rose-300'
              : opt.status === 'low'
              ? 'bg-amber-50 border-amber-300'
              : opt.status === 'overstock'
              ? 'bg-sky-50 border-sky-300'
              : 'bg-emerald-50 border-emerald-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {opt.status === 'stockout_risk' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : opt.status === 'low' ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    {opt.status === 'stockout_risk'
                      ? 'Critical Action: Expedite Reorder Now'
                      : opt.status === 'low'
                      ? 'Inventory Below ROP Trigger: Issue Purchase Order'
                      : opt.status === 'overstock'
                      ? 'Overstocked: Halt Reorders & Consider Promotional Markdown'
                      : 'Inventory Healthy: No Action Required'}
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {opt.recommendedOrderQuantity > 0
                      ? `Recommended batch order of ${opt.recommendedOrderQuantity} units (Total: ${formatINR(opt.recommendedOrderQuantity * currentSku.unitCost)}) to restore inventory buffer.`
                      : `Current on-hand stock (${currentSku.currentStock} units) satisfies demand past the ${leadTimeDays}-day lead time window.`}
                  </p>
                </div>
              </div>

              {opt.recommendedOrderQuantity > 0 && (
                <button
                  onClick={() => onOpenNewPO(currentSku.id, opt.recommendedOrderQuantity)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Create PO ({opt.recommendedOrderQuantity} units) &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Stock Depletion Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Replenishment Simulation Depletion Curve</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateReplenishment}
                  onChange={(e) => setSimulateReplenishment(e.target.checked)}
                  className="rounded-xs text-blue-600 focus:ring-blue-500"
                />
                <span>Simulate PO arrival on Day {leadTimeDays}</span>
              </label>
            </div>

            <StockDepletionChart
              currentStock={currentSku.currentStock}
              inTransitStock={currentSku.inTransitStock}
              dailyAvgDemand={opt.dailyDemandAvg}
              reorderPoint={opt.reorderPoint}
              safetyStock={opt.safetyStock}
              leadTimeDays={leadTimeDays}
              recommendedOrderQuantity={opt.recommendedOrderQuantity || opt.eoq}
              simulateReplenishment={simulateReplenishment}
            />
          </div>

          {/* Total Cost Analysis (Holding vs Ordering Tradeoff) in INR */}
          <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Annual Cost Tradeoff (Total: {formatINR(opt.totalAnnualCost)}/yr)
              </span>
              <span className="text-[11px] text-blue-700 font-medium">EOQ Minimizes Combined Holding + Ordering</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
                <div className="text-slate-500">Annual Carrying Cost:</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatINR(opt.annualHoldingCost)}
                </div>
                <div className="text-[10px] text-slate-400">Holding ({opt.eoq}/2 + {opt.safetyStock} SS) units</div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
                <div className="text-slate-500">Annual Ordering Setup Cost:</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatINR(opt.annualOrderingCost)}
                </div>
                <div className="text-[10px] text-slate-400">~{(opt.annualDemand / Math.max(opt.eoq, 1)).toFixed(1)} orders/yr @ ₹{orderSetupCost}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
