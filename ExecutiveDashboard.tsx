import React from 'react';
import { SKU, InventoryOptimizationMetrics, AnomalyAlert } from '../types/inventory';
import { formatINR } from '../utils/inventoryCalculations';
import {
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  RotateCcw,
  ArrowUpRight,
  ArrowRight,
  Flame,
  Clock,
  Warehouse,
  IndianRupee,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  skus: SKU[];
  optimizations: Record<string, InventoryOptimizationMetrics>;
  alerts: AnomalyAlert[];
  onSelectSku: (skuId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenNewPO: (skuId?: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  skus,
  optimizations,
  alerts,
  onSelectSku,
  onNavigateTab,
  onOpenNewPO,
}) => {
  // Aggregate KPI computations in INR
  const totalValuation = skus.reduce((sum, s) => sum + s.currentStock * s.unitCost, 0);
  const totalUnits = skus.reduce((sum, s) => sum + s.currentStock, 0);

  const stockoutRiskSkus = skus.filter(
    (s) => optimizations[s.id]?.status === 'stockout_risk'
  );

  const overstockedSkus = skus.filter(
    (s) => optimizations[s.id]?.status === 'overstock'
  );

  const deadStockCapital = overstockedSkus.reduce(
    (sum, s) => sum + Math.max(s.currentStock - 200, 0) * s.unitCost,
    0
  );

  const pendingReordersCount = skus.filter(
    (s) => (optimizations[s.id]?.recommendedOrderQuantity || 0) > 0
  ).length;

  const avgMAPE = 5.8; // Ensemble model average across dataset

  // Status distributions
  const counts = {
    healthy: skus.filter((s) => optimizations[s.id]?.status === 'healthy').length,
    low: skus.filter((s) => optimizations[s.id]?.status === 'low').length,
    stockout_risk: stockoutRiskSkus.length,
    overstock: overstockedSkus.length,
  };
  const totalCount = skus.length || 1;

  return (
    <div id="executive-dashboard-view" className="space-y-6">
      {/* Quick Friendly Intro Card for Easy Understanding */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Desh Ki Supply Grid Overview (Bharat Network)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-sky-200 text-blue-700">
                  Active Facilities: 6 Hubs
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Real-time stock balance across Bhiwandi, Bilaspur, Sriperumbudur, Hoskote, Dankuni &amp; Shamshabad.
                Prices and values calculated in Indian Rupees (₹).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onNavigateTab('forecasting')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-100 text-xs font-semibold text-blue-700 border border-sky-200 transition-colors shadow-2xs"
            >
              Aage Ki Demand (Forecast)
            </button>
            <button
              onClick={() => onNavigateTab('multi_echelon')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              Inter-City Stock Transfer
            </button>
          </div>
        </div>
      </div>

      {/* 5 Executive KPI Cards in Normal Blue Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Valuation in INR */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Stock Value</span>
            <div className="p-1.5 rounded-md bg-sky-50 text-blue-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(totalValuation, { compact: true })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <span className="font-semibold text-blue-700">{totalUnits.toLocaleString('en-IN')}</span>
            <span>units on-hand</span>
          </div>
        </div>

        {/* Forecast Accuracy */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Forecast Accuracy</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {(100 - avgMAPE).toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700 mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>MAPE 5.8% (Festive AI)</span>
          </div>
        </div>

        {/* Stockout Risk (Khatam hone ka risk) */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Urgent Stockout Risk</span>
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {stockoutRiskSkus.length} <span className="text-xs font-normal text-slate-500">Products</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-medium">
            <span>&lt; 3 days runway remaining</span>
          </div>
        </div>

        {/* Overstocked / Dead Stock Capital in INR */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Trapped Capital</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(deadStockCapital, { compact: true })}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-700 mt-1.5">
            <span>{overstockedSkus.length} SKUs &gt; 90d supply</span>
          </div>
        </div>

        {/* Recommended Reorders */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Agla Order (POs)</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 tracking-tight">
            {pendingReordersCount} <span className="text-xs font-normal text-slate-500">Ready</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
            <span>Calculated via EOQ &amp; ROP</span>
          </div>
        </div>
      </div>

      {/* Inventory Health Ratio Banner */}
      <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Desh-Wide Stock Status Ratio</h3>
            <p className="text-xs text-slate-500">Balance across all regional fulfillment nodes in India</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Healthy ({counts.healthy})
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reorder Soon ({counts.low})
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Stockout Danger ({counts.stockout_risk})
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Excess Stock ({counts.overstock})
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-sky-100/60 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(counts.healthy / totalCount) * 100}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Healthy: ${counts.healthy}`}
          />
          <div
            style={{ width: `${(counts.low / totalCount) * 100}%` }}
            className="bg-amber-400 transition-all duration-300"
            title={`Low/Reorder: ${counts.low}`}
          />
          <div
            style={{ width: `${(counts.stockout_risk / totalCount) * 100}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Stockout Risk: ${counts.stockout_risk}`}
          />
          <div
            style={{ width: `${(counts.overstock / totalCount) * 100}%` }}
            className="bg-sky-500 transition-all duration-300"
            title={`Overstocked: ${counts.overstock}`}
          />
        </div>
      </div>

      {/* Critical Alert Spotlight */}
      {alerts.length > 0 && (
        <div className="border border-rose-200 bg-rose-50/70 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-xs">
                    Priority 1 Logistics Anomaly
                  </span>
                  <h4 className="text-sm font-bold text-rose-900">{alerts[0].title}</h4>
                </div>
                <p className="text-xs text-rose-700 mt-1 max-w-3xl">
                  {alerts[0].skuName} ({alerts[0].skuCode}) at {alerts[0].locationName}: {alerts[0].rootCause}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-rose-800 font-medium">
                  <span>Detected Rate: {alerts[0].metricValue}</span>
                  <span>•</span>
                  <span>Threshold: {alerts[0].threshold}</span>
                  <span>•</span>
                  <span className="text-rose-950 font-bold">
                    Action: {alerts[0].recommendedAction}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
              <button
                id="btn-alert-dispatch-po"
                onClick={() => onOpenNewPO(alerts[0].skuId)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Emergency Dispatch PO (₹)
              </button>
              <button
                id="btn-view-anomaly-radar"
                onClick={() => onNavigateTab('anomalies')}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-100 text-rose-800 text-xs font-medium transition-colors cursor-pointer"
              >
                View Alerts ({alerts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master SKU Intelligence Matrix */}
      <div className="bg-white border border-sky-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-sky-50/30">
          <div>
            <h3 className="text-base font-bold text-slate-900">SKU Inventory &amp; Demand Performance</h3>
            <p className="text-xs text-slate-500">
              Real-time balance of stock, lead times, replenishment triggers, and ML forecasts across India
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('output_interface')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs font-semibold text-blue-800 border border-sky-200 transition-colors cursor-pointer"
            >
              <span>Output Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('forecasting')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <span>Demand Forecasting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sky-50/60 border-b border-sky-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Product (उत्पाद)</th>
                <th className="py-3 px-3">Facility (वेयरहाउस)</th>
                <th className="py-3 px-3">Daily Demand</th>
                <th className="py-3 px-3">Unit Price (₹)</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Runway (Days)</th>
                <th className="py-3 px-3">Reorder Point (ROP)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Agla Order (PO)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {skus.map((sku) => {
                const opt = optimizations[sku.id];
                const isRisk = opt?.status === 'stockout_risk';
                const isLow = opt?.status === 'low';
                const isOver = opt?.status === 'overstock';

                return (
                  <tr
                    key={sku.id}
                    className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectSku(sku.id)}
                  >
                    {/* SKU Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {sku.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{sku.skuCode}</span>
                        <span>•</span>
                        <span>{sku.category}</span>
                        {sku.anomaly && (
                          <span className="px-1.5 py-0.2 rounded-xs bg-rose-100 text-rose-700 font-sans font-semibold text-[10px]">
                            {sku.anomaly.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Facility */}
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">{sku.locationName.split(' ')[0]}</span>
                      </div>
                    </td>

                    {/* Daily Demand */}
                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      <strong>{opt?.dailyDemandAvg || 0}</strong> u/d
                      <div className="text-[10px] text-slate-400">σ = {opt?.dailyDemandStdDev}</div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                      {formatINR(sku.sellingPrice)}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-900 font-mono">
                        {sku.currentStock.toLocaleString('en-IN')}
                      </span>
                      {sku.inTransitStock > 0 && (
                        <div className="text-[10px] text-blue-600 font-medium">
                          +{sku.inTransitStock.toLocaleString('en-IN')} in-transit
                        </div>
                      )}
                    </td>

                    {/* Runway */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className={`font-semibold font-mono ${
                            (opt?.daysOfSupply || 0) < 5
                              ? 'text-rose-600'
                              : (opt?.daysOfSupply || 0) > 60
                              ? 'text-sky-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {opt?.daysOfSupply} days
                        </span>
                      </div>
                    </td>

                    {/* ROP & Safety Stock */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      <div>ROP: <strong>{opt?.reorderPoint}</strong></div>
                      <div className="text-slate-400">SS: {opt?.safetyStock}</div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isRisk && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Stockout Risk
                        </span>
                      )}
                      {isLow && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Reorder Due
                        </span>
                      )}
                      {isOver && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-blue-800 border border-sky-200">
                          Overstocked
                        </span>
                      )}
                      {!isRisk && !isLow && !isOver && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Reorder Qty */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                      {(opt?.recommendedOrderQuantity || 0) > 0 ? (
                        <span className="font-bold text-blue-700">
                          +{opt?.recommendedOrderQuantity} units
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {(opt?.recommendedOrderQuantity || 0) > 0 && (
                          <button
                            onClick={() => onOpenNewPO(sku.id)}
                            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors shadow-2xs cursor-pointer"
                          >
                            Order Now
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectSku(sku.id);
                            onNavigateTab('forecasting');
                          }}
                          className="px-2.5 py-1 rounded-md border border-sky-200 hover:bg-sky-100 text-blue-700 font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Forecast
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
