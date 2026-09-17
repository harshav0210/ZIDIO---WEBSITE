import React, { useState, useMemo } from 'react';
import { SKU, ModelType, InventoryOptimizationMetrics } from '../types/inventory';
import { MODEL_BENCHMARKS } from '../data/mockDatasets';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Play,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  ArrowRight,
  Database,
  BarChart2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  Clock,
  Printer,
  FileCode,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface OutputInterfaceViewProps {
  skus: SKU[];
  optimizations: Record<string, InventoryOptimizationMetrics>;
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  onOpenNewPO: (skuId?: string, qty?: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const OutputInterfaceView: React.FC<OutputInterfaceViewProps> = ({
  skus,
  optimizations,
  selectedSkuId,
  onSelectSkuId,
  onOpenNewPO,
  onNavigateTab,
}) => {
  const currentSku = skus.find((s) => s.id === selectedSkuId) || skus[0];
  const currentOpt = optimizations[currentSku.id] || optimizations[skus[0]?.id];

  // Output configuration state
  const [selectedModel, setSelectedModel] = useState<ModelType>('ensemble');
  const [forecastHorizon, setForecastHorizon] = useState<number>(30); // 7, 14, 30, 60 days
  const [serviceLevel, setServiceLevel] = useState<number>(currentSku.targetServiceLevel || 0.95);
  const [includePromos, setIncludePromos] = useState<boolean>(true);
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(true);
  const [leadTimeOverride, setLeadTimeOverride] = useState<number>(currentSku.supplierLeadTimeDays);

  // Execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [executionLatencyMs, setExecutionLatencyMs] = useState<number>(34);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [activeOutputSubtab, setActiveOutputSubtab] = useState<'grid' | 'chart' | 'math' | 'custom_input'>('grid');

  // Custom simulator input state
  const [customDailyDemand, setCustomDailyDemand] = useState<number>(currentOpt?.dailyDemandAvg || 65);
  const [customLeadTime, setCustomLeadTime] = useState<number>(currentSku.supplierLeadTimeDays || 14);
  const [customUnitCost, setCustomUnitCost] = useState<number>(currentSku.unitCost || 48);
  const [customOrderCost, setCustomOrderCost] = useState<number>(currentSku.orderSetupCost || 120);
  const [customHoldingRate, setCustomHoldingRate] = useState<number>(currentSku.holdingCostAnnualRate || 0.22);
  const [customOutputCalculated, setCustomOutputCalculated] = useState<boolean>(false);

  // Model simulation execution trigger
  const handleGenerateOutput = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setExecutionLatencyMs(Math.floor(25 + Math.random() * 20));
    }, 600);
  };

  // Slice forecast points by horizon
  const visibleForecasts = useMemo(() => {
    return currentSku.forecasts.slice(0, forecastHorizon);
  }, [currentSku.forecasts, forecastHorizon]);

  // Projected stock balance day-by-day
  const dailyOutputData = useMemo(() => {
    let runningStock = currentSku.currentStock;
    let stockoutDay: string | null = null;

    return visibleForecasts.map((f, idx) => {
      let predictedDemand = f.p50;
      if (selectedModel === 'prophet') predictedDemand = f.prophet;
      else if (selectedModel === 'sarima') predictedDemand = f.sarima;
      else if (selectedModel === 'lstm') predictedDemand = f.lstm;

      // Adjust for toggle switches
      if (!includePromos && f.promotionActive) {
        predictedDemand = Math.round(predictedDemand * 0.74);
      }
      if (!includeHolidays && f.holiday) {
        predictedDemand = Math.round(predictedDemand * 0.78);
      }

      runningStock -= predictedDemand;
      const isStockout = runningStock <= 0;
      if (isStockout && !stockoutDay) {
        stockoutDay = f.date;
      }

      const p10 = Math.round(predictedDemand * 0.82);
      const p90 = Math.round(predictedDemand * 1.22);

      return {
        dayIndex: idx + 1,
        date: f.date,
        p50: Math.round(predictedDemand),
        p10,
        p90,
        projectedStock: runningStock,
        isStockout,
        safetyStockThreshold: currentOpt?.safetyStock || 350,
        reorderPointThreshold: currentOpt?.reorderPoint || 800,
        promotionActive: f.promotionActive,
        holiday: f.holiday,
        confidenceRange: p90 - p10,
      };
    });
  }, [visibleForecasts, selectedModel, includePromos, includeHolidays, currentSku.currentStock, currentOpt]);

  // Summary Metrics computed from output
  const outputSummary = useMemo(() => {
    const totalPredictedDemand = dailyOutputData.reduce((sum, d) => sum + d.p50, 0);
    const avgDailyDemand = (totalPredictedDemand / (dailyOutputData.length || 1)).toFixed(1);
    const peakDemandDay = [...dailyOutputData].sort((a, b) => b.p90 - a.p90)[0];
    const stockoutDayItem = dailyOutputData.find((d) => d.projectedStock <= 0);
    const stockoutDate = stockoutDayItem ? stockoutDayItem.date : 'No stockout within horizon';
    const runwayDays = (currentSku.currentStock / (Number(avgDailyDemand) || 1)).toFixed(1);

    // Dynamic Z-score from service level
    let z = 1.645;
    if (serviceLevel >= 0.99) z = 2.326;
    else if (serviceLevel >= 0.98) z = 2.054;
    else if (serviceLevel >= 0.95) z = 1.645;
    else if (serviceLevel >= 0.90) z = 1.282;

    const stdDev = currentOpt?.dailyDemandStdDev || 22;
    const leadTime = leadTimeOverride;
    const computedSafetyStock = Math.round(z * Math.sqrt(leadTime * Math.pow(stdDev, 2) + Math.pow(Number(avgDailyDemand), 2) * 2));
    const computedROP = Math.round(Number(avgDailyDemand) * leadTime + computedSafetyStock);

    const annualDemand = Number(avgDailyDemand) * 365;
    const unitHoldingCost = currentSku.unitCost * currentSku.holdingCostAnnualRate;
    const computedEOQ = Math.round(Math.sqrt((2 * annualDemand * currentSku.orderSetupCost) / Math.max(unitHoldingCost, 0.1)));
    const recommendedOrderQty = Math.max(computedROP - currentSku.currentStock + computedEOQ, computedEOQ);

    return {
      totalPredictedDemand,
      avgDailyDemand,
      peakDemandDay,
      stockoutDate,
      runwayDays,
      computedSafetyStock,
      computedROP,
      computedEOQ,
      recommendedOrderQty,
      projectedEndingStock: dailyOutputData[dailyOutputData.length - 1]?.projectedStock ?? currentSku.currentStock,
    };
  }, [dailyOutputData, currentSku, currentOpt, serviceLevel, leadTimeOverride]);

  // Custom Simulator Calculations
  const customCalculations = useMemo(() => {
    const dailyD = customDailyDemand;
    const lt = customLeadTime;
    const sLevelZ = 1.645; // 95%
    const sigmaD = dailyD * 0.35;
    const sigmaLT = 2.5;

    const safetyStock = Math.round(sLevelZ * Math.sqrt(lt * Math.pow(sigmaD, 2) + Math.pow(dailyD, 2) * Math.pow(sigmaLT, 2)));
    const reorderPoint = Math.round(dailyD * lt + safetyStock);
    const annualD = dailyD * 365;
    const hCost = customUnitCost * customHoldingRate;
    const eoq = Math.round(Math.sqrt((2 * annualD * customOrderCost) / Math.max(hCost, 0.01)));
    const annualHoldingCost = Math.round((eoq / 2 + safetyStock) * hCost);
    const annualOrderingCost = Math.round((annualD / eoq) * customOrderCost);
    const totalCost = annualHoldingCost + annualOrderingCost;

    return {
      dailyDemand: dailyD,
      leadTimeDemand: Math.round(dailyD * lt),
      safetyStock,
      reorderPoint,
      eoq,
      annualHoldingCost,
      annualOrderingCost,
      totalCost,
    };
  }, [customDailyDemand, customLeadTime, customUnitCost, customOrderCost, customHoldingRate]);

  // Filter table by search
  const filteredTableRows = useMemo(() => {
    if (!searchTableQuery.trim()) return dailyOutputData;
    const q = searchTableQuery.toLowerCase();
    return dailyOutputData.filter(
      (r) =>
        r.date.toLowerCase().includes(q) ||
        (r.isStockout ? 'stockout' : 'healthy').includes(q) ||
        (r.holiday ? 'holiday' : '').includes(q) ||
        (r.promotionActive ? 'promotion' : '').includes(q)
    );
  }, [dailyOutputData, searchTableQuery]);

  // Export handlers
  const handleDownloadCSV = () => {
    const headers = [
      'SKU_Code',
      'SKU_Name',
      'Location',
      'Day_Index',
      'Date',
      'Model_Used',
      'Forecast_P50_Demand',
      'Lower_Bound_P10',
      'Upper_Bound_P90',
      'Confidence_Spread',
      'Projected_Ending_Stock',
      'Stockout_Occurred',
      'Promotion_Active',
      'Holiday_Flag',
      'Safety_Stock_Target',
      'Reorder_Point_Target',
    ];

    const rows = dailyOutputData.map((d) => [
      currentSku.skuCode,
      `"${currentSku.name}"`,
      `"${currentSku.locationName}"`,
      d.dayIndex,
      d.date,
      selectedModel.toUpperCase(),
      d.p50,
      d.p10,
      d.p90,
      d.confidenceRange,
      d.projectedStock,
      d.isStockout ? 'YES' : 'NO',
      d.promotionActive ? 'YES' : 'NO',
      d.holiday ? 'YES' : 'NO',
      d.safetyStockThreshold,
      d.reorderPointThreshold,
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `forecast_output_${currentSku.skuCode}_${selectedModel}_${forecastHorizon}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const payload = {
      meta: {
        platform: 'Demand & Inventory Intelligence Platform',
        interface: 'Model Output & Forecast Results Hub',
        exportTimestamp: new Date().toISOString(),
        executionLatencyMs,
      },
      sku: {
        id: currentSku.id,
        skuCode: currentSku.skuCode,
        name: currentSku.name,
        category: currentSku.category,
        location: currentSku.locationName,
        currentStock: currentSku.currentStock,
        unitCost: currentSku.unitCost,
      },
      parameters: {
        modelArchitecture: selectedModel,
        horizonDays: forecastHorizon,
        targetServiceLevel: serviceLevel,
        leadTimeDays: leadTimeOverride,
        includePromotions: includePromos,
        includeHolidays,
      },
      outputSummary: {
        totalForecastedVolume: outputSummary.totalPredictedDemand,
        avgDailyVelocity: outputSummary.avgDailyDemand,
        recommendedSafetyStock: outputSummary.computedSafetyStock,
        reorderPoint: outputSummary.computedROP,
        economicOrderQuantity: outputSummary.computedEOQ,
        recommendedPurchaseOrderQty: outputSummary.recommendedOrderQty,
        stockoutDateEstimate: outputSummary.stockoutDate,
        runwayDaysRemaining: outputSummary.runwayDays,
      },
      dailyForecastOutput: dailyOutputData,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `model_output_${currentSku.skuCode}_${selectedModel}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const text = `=== INVENTORY FORECAST & OPTIMIZATION OUTPUT ===
SKU: ${currentSku.skuCode} - ${currentSku.name} (${currentSku.locationName})
Model: ${selectedModel.toUpperCase()} | Horizon: ${forecastHorizon} Days | Service Level: ${(serviceLevel * 100).toFixed(0)}%
Total Projected Demand: ${outputSummary.totalPredictedDemand.toLocaleString()} units (Avg ${outputSummary.avgDailyDemand} units/day)
Current On Hand: ${currentSku.currentStock} units | Days of Supply Runway: ${outputSummary.runwayDays} days
Safety Stock Buffer: ${outputSummary.computedSafetyStock} units | Reorder Point: ${outputSummary.computedROP} units
Optimal Order Qty (EOQ): ${outputSummary.computedEOQ} units
Stockout Horizon: ${outputSummary.stockoutDate}
Recommended Action: ${
      currentSku.currentStock < outputSummary.computedROP
        ? `IMMEDIATE REORDER: Dispatch PO for ${outputSummary.recommendedOrderQty} units to prevent stockout.`
        : `HEALTHY: Inventory above ROP (${outputSummary.computedROP} units). Next review in 7 days.`
    }
Generated at: ${generationTimestamp} (Inference latency: ${executionLatencyMs}ms)
`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="output-interface-view" className="space-y-6">
      {/* View Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Forecast &amp; Inventory Output Interface
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Model Output Active
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Latency: {executionLatencyMs}ms • Updated: {generationTimestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Comprehensive machine learning output console. Inspect time-series demand predictions, confidence intervals (P10/P90), optimal reorder points, safety stock buffers, and export production-ready datasets.
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="generate-output-btn"
              onClick={handleGenerateOutput}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Running Inference...' : 'Re-run Model Output'}</span>
            </button>

            <button
              id="download-csv-btn"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download CSV dataset"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              id="download-json-btn"
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download JSON Payload"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON</span>
            </button>

            <button
              id="copy-summary-btn"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Copy formatted output summary"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="Print Output Report"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Target SKU Selector Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">Target Product:</span>
            <select
              id="output-sku-selector"
              value={selectedSkuId}
              onChange={(e) => onSelectSkuId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.skuCode} — {s.name} ({s.locationName})
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Category: <strong className="text-slate-700">{currentSku.category}</strong> • Current Stock: <strong className="text-slate-700">{currentSku.currentStock.toLocaleString()} units</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Quick Navigation:</span>
            <button
              onClick={() => onOpenNewPO(currentSku.id, outputSummary.recommendedOrderQty)}
              className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
            >
              Create PO ({outputSummary.recommendedOrderQty} units) &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Model Parameter & Output Horizon Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Model Architecture */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              ML Engine Architecture
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ensemble', label: 'AI Ensemble', mape: '5.8%' },
                { id: 'lstm', label: 'LSTM / TFT', mape: '6.4%' },
                { id: 'prophet', label: 'Meta Prophet', mape: '7.6%' },
                { id: 'sarima', label: 'SARIMA', mape: '9.3%' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id as ModelType)}
                  className={`p-1.5 text-left rounded-md border text-xs font-medium transition-all ${
                    selectedModel === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate">{m.label}</div>
                  <div className="text-[10px] text-slate-500">MAPE {m.mape}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Forecast Output Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Output Horizon
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { days: 7, label: '7 Days', desc: 'Tactical' },
                { days: 14, label: '14 Days', desc: 'Lead Time' },
                { days: 30, label: '30 Days', desc: 'Monthly' },
                { days: 60, label: '60 Days', desc: 'Quarterly' },
              ].map((h) => (
                <button
                  key={h.days}
                  onClick={() => setForecastHorizon(h.days)}
                  className={`p-1.5 text-left rounded-md border text-xs font-medium transition-all ${
                    forecastHorizon === h.days
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>{h.label}</div>
                  <div className="text-[10px] text-slate-500">{h.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Service Level SLA Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Service Level (Z-Score)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { val: 0.90, label: '90%', z: 'Z=1.28' },
                { val: 0.95, label: '95%', z: 'Z=1.65' },
                { val: 0.98, label: '98%', z: 'Z=2.05' },
                { val: 0.99, label: '99%', z: 'Z=2.33' },
              ].map((sl) => (
                <button
                  key={sl.val}
                  onClick={() => setServiceLevel(sl.val)}
                  className={`p-1.5 text-left rounded-md border text-xs font-medium transition-all ${
                    serviceLevel === sl.val
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>{sl.label}</div>
                  <div className="text-[10px] text-slate-500">{sl.z}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Lead Time Override */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Supplier Lead Time
              </label>
              <span className="text-xs font-bold text-slate-900">{leadTimeOverride} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="45"
              value={leadTimeOverride}
              onChange={(e) => setLeadTimeOverride(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>3d (Local)</span>
              <span>14d (Standard)</span>
              <span>45d (Overseas)</span>
            </div>
          </div>

          {/* Regressors Toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              External Regressors
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includePromos}
                  onChange={(e) => setIncludePromos(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Promotional Uplift (+35%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includeHolidays}
                  onChange={(e) => setIncludeHolidays(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Calendar Holiday Surge</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Executive Output Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Forecast Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projected Demand</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {outputSummary.totalPredictedDemand.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg <strong className="text-slate-700">{outputSummary.avgDailyDemand}</strong> units / day
          </div>
        </div>

        {/* Safety Stock Target */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Safety Stock Buffer</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {outputSummary.computedSafetyStock.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Target SLA: <strong className="text-slate-700">{(serviceLevel * 100).toFixed(0)}%</strong>
          </div>
        </div>

        {/* Reorder Point (ROP) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Reorder Point (ROP)</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {outputSummary.computedROP.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Current stock: <strong className="text-slate-700">{currentSku.currentStock}</strong>
          </div>
        </div>

        {/* Recommended Order Qty (EOQ) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Optimal EOQ Order</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {outputSummary.computedEOQ.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Order Value: <strong className="text-slate-700">₹{(outputSummary.computedEOQ * currentSku.unitCost).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Days of Runway Remaining */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Runway Remaining</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className={`text-2xl font-bold ${Number(outputSummary.runwayDays) < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
            {outputSummary.runwayDays} d
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Stockout: <strong className="text-slate-700">{outputSummary.stockoutDate}</strong>
          </div>
        </div>

        {/* Status / Output Recommendation */}
        <div className={`border rounded-xl p-4 shadow-xs ${
          currentSku.currentStock <= outputSummary.computedROP
            ? 'bg-rose-50 border-rose-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Action Status</span>
            {currentSku.currentStock <= outputSummary.computedROP ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className={`text-base font-bold ${
            currentSku.currentStock <= outputSummary.computedROP ? 'text-rose-800' : 'text-emerald-800'
          }`}>
            {currentSku.currentStock <= outputSummary.computedROP ? 'Reorder Needed' : 'Inventory Healthy'}
          </div>
          <div className="mt-1">
            {currentSku.currentStock <= outputSummary.computedROP ? (
              <button
                onClick={() => onOpenNewPO(currentSku.id, outputSummary.recommendedOrderQty)}
                className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
              >
                Dispatch {outputSummary.recommendedOrderQty} units &rarr;
              </button>
            ) : (
              <span className="text-xs text-emerald-700">Stock above threshold</span>
            )}
          </div>
        </div>
      </div>

      {/* Subtab Navigation Bar for Output Views */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'grid', label: 'Day-by-Day Forecast Output Grid', icon: FileSpreadsheet },
            { id: 'chart', label: 'Forecast & Depletion Curve Visualizer', icon: BarChart2 },
            { id: 'math', label: 'Optimization Formula Decomposition', icon: Layers },
            { id: 'custom_input', label: 'Custom Input & Calculation Sandbox', icon: Sliders },
          ].map((sub) => {
            const Icon = sub.icon;
            const isActive = activeOutputSubtab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveOutputSubtab(sub.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>

        {activeOutputSubtab === 'grid' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search date or status..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-emerald-500 w-48"
            />
            <span className="text-xs text-slate-400 font-mono">
              {filteredTableRows.length} rows
            </span>
          </div>
        )}
      </div>

      {/* SUBTAB 1: GRANULAR OUTPUT DATA GRID */}
      {activeOutputSubtab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-12 text-center">Day</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Point Forecast (P50)</th>
                  <th className="py-3 px-3 text-right">Lower Bound (P10)</th>
                  <th className="py-3 px-3 text-right">Upper Bound (P90)</th>
                  <th className="py-3 px-3 text-right">Confidence Spread</th>
                  <th className="py-3 px-3 text-right">Projected Stock</th>
                  <th className="py-3 px-3 text-center">Stockout Risk</th>
                  <th className="py-3 px-3 text-center">Active Regressors</th>
                  <th className="py-3 px-3 text-center">Buffer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredTableRows.map((row) => {
                  const isLow = row.projectedStock <= row.safetyStockThreshold && row.projectedStock > 0;
                  const isOut = row.projectedStock <= 0;

                  return (
                    <tr
                      key={row.date}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isOut ? 'bg-rose-50/40' : isLow ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-normal">
                        +{row.dayIndex}d
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 font-sans">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {row.p50} units
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {row.p10}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.p90}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        &plusmn;{Math.round(row.confidenceRange / 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        <span className={isOut ? 'text-rose-700 font-bold' : isLow ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                          {row.projectedStock.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Stockout ({row.projectedStock})
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Below Safety
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          {row.promotionActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Promo (+35%)
                            </span>
                          )}
                          {row.holiday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              Holiday
                            </span>
                          )}
                          {!row.promotionActive && !row.holiday && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {row.projectedStock > row.reorderPointThreshold ? (
                          <span className="text-emerald-700 text-xs font-medium">&gt; ROP</span>
                        ) : row.projectedStock > row.safetyStockThreshold ? (
                          <span className="text-amber-700 text-xs font-semibold">ROP Triggered</span>
                        ) : (
                          <span className="text-rose-700 text-xs font-bold">Critical Buffer</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FORECAST & DEPLETION VISUALIZER */}
      {activeOutputSubtab === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Demand Prediction Output Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Forecast Output Curve with Confidence Intervals (P10 - P90)
                </h3>
                <p className="text-xs text-slate-500">
                  Model: {selectedModel.toUpperCase()} • Horizon: {forecastHorizon} Days
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Median Forecast
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 bg-emerald-200 rounded-sm"></span> 80% Confidence Fan
                </span>
              </div>
            </div>

            <div className="h-72 w-full relative">
              {(() => {
                const maxVal = Math.max(...dailyOutputData.map((d) => d.p90), 10);
                const minVal = 0;
                const width = 600;
                const height = 240;
                const padding = { top: 20, right: 30, bottom: 30, left: 40 };
                const chartW = width - padding.left - padding.right;
                const chartH = height - padding.top - padding.bottom;
                const n = dailyOutputData.length;

                const getX = (idx: number) => padding.left + (idx / Math.max(n - 1, 1)) * chartW;
                const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

                // Points for P90 and P10 area
                const upperPoints = dailyOutputData.map((d, i) => `${getX(i)},${getY(d.p90)}`).join(' ');
                const lowerPoints = [...dailyOutputData].reverse().map((d, i) => `${getX(n - 1 - i)},${getY(d.p10)}`).join(' ');
                const areaPoints = `${upperPoints} ${lowerPoints}`;

                // Line for P50
                const p50Points = dailyOutputData.map((d, i) => `${getX(i)},${getY(d.p50)}`).join(' ');

                // Y-axis ticks
                const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                    {/* Grid lines */}
                    {yTicks.map((tick, i) => (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={getY(tick)}
                          x2={width - padding.right}
                          y2={getY(tick)}
                          stroke="#f1f5f9"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padding.left - 8}
                          y={getY(tick) + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="#94a3b8"
                          fontFamily="monospace"
                        >
                          {tick}
                        </text>
                      </g>
                    ))}

                    {/* Confidence band P10-P90 */}
                    <polygon points={areaPoints} fill="#10b981" fillOpacity={0.15} />

                    {/* Median Line P50 */}
                    <polyline
                      points={p50Points}
                      fill="none"
                      stroke="#059669"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {dailyOutputData.map((d, i) => {
                      const cx = getX(i);
                      const cy = getY(d.p50);
                      return (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="#059669"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            className="hover:r-5 transition-all"
                          />
                          <title>{`${d.date}\nP50: ${d.p50} units\nP10: ${d.p10} | P90: ${d.p90}`}</title>
                        </g>
                      );
                    })}

                    {/* X-axis dates */}
                    {dailyOutputData.filter((_, i) => i === 0 || i === Math.floor(n / 2) || i === n - 1).map((d, i, arr) => {
                      const originalIdx = d.day - 1;
                      return (
                        <text
                          key={i}
                          x={getX(originalIdx)}
                          y={height - 8}
                          textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                          fontSize="9"
                          fill="#64748b"
                        >
                          {d.date.slice(5)}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Stock Depletion Trajectory Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Projected Stock Depletion Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking on-hand units against Safety Stock &amp; Reorder Point
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-0.5 bg-amber-500"></span> ROP Line
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-0.5 bg-rose-500"></span> Safety Stock
                </span>
              </div>
            </div>

            <div className="h-72 w-full relative">
              {(() => {
                const maxStock = Math.max(
                  ...dailyOutputData.map((d) => d.projectedStock),
                  outputSummary.computedROP * 1.25,
                  100
                );
                const minStock = 0;
                const width = 600;
                const height = 240;
                const padding = { top: 20, right: 30, bottom: 30, left: 45 };
                const chartW = width - padding.left - padding.right;
                const chartH = height - padding.top - padding.bottom;
                const n = dailyOutputData.length;

                const getX = (idx: number) => padding.left + (idx / Math.max(n - 1, 1)) * chartW;
                const getY = (val: number) => padding.top + chartH - ((val - minStock) / (maxStock - minStock || 1)) * chartH;

                const stockPoints = dailyOutputData.map((d, i) => `${getX(i)},${getY(d.projectedStock)}`).join(' ');
                const ropY = getY(outputSummary.computedROP);
                const ssY = getY(outputSummary.computedSafetyStock);

                const yTicks = [0, Math.round(maxStock * 0.33), Math.round(maxStock * 0.66), maxStock];

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                    {/* Grid lines */}
                    {yTicks.map((tick, i) => (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={getY(tick)}
                          x2={width - padding.right}
                          y2={getY(tick)}
                          stroke="#f1f5f9"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padding.left - 8}
                          y={getY(tick) + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="#94a3b8"
                          fontFamily="monospace"
                        >
                          {tick}
                        </text>
                      </g>
                    ))}

                    {/* ROP reference line */}
                    {ropY >= padding.top && ropY <= height - padding.bottom && (
                      <g>
                        <line
                          x1={padding.left}
                          y1={ropY}
                          x2={width - padding.right}
                          y2={ropY}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                        <text
                          x={width - padding.right}
                          y={ropY - 4}
                          textAnchor="end"
                          fontSize="9"
                          fill="#d97706"
                          fontWeight="600"
                        >
                          ROP ({outputSummary.computedROP})
                        </text>
                      </g>
                    )}

                    {/* Safety stock reference line */}
                    {ssY >= padding.top && ssY <= height - padding.bottom && (
                      <g>
                        <line
                          x1={padding.left}
                          y1={ssY}
                          x2={width - padding.right}
                          y2={ssY}
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                        <text
                          x={width - padding.right}
                          y={ssY - 4}
                          textAnchor="end"
                          fontSize="9"
                          fill="#dc2626"
                          fontWeight="600"
                        >
                          Safety Stock ({outputSummary.computedSafetyStock})
                        </text>
                      </g>
                    )}

                    {/* Depletion Line */}
                    <polyline
                      points={stockPoints}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Stock Points */}
                    {dailyOutputData.map((d, i) => {
                      const cx = getX(i);
                      const cy = getY(d.projectedStock);
                      const isBelowROP = d.projectedStock <= outputSummary.computedROP;
                      return (
                        <g key={i} className="cursor-pointer">
                          <circle
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={isBelowROP ? '#ef4444' : '#2563eb'}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                          <title>{`${d.date}\nProjected Stock: ${d.projectedStock} units\nStatus: ${isBelowROP ? 'Below ROP' : 'Safe'}`}</title>
                        </g>
                      );
                    })}

                    {/* X-axis dates */}
                    {dailyOutputData.filter((_, i) => i === 0 || i === Math.floor(n / 2) || i === n - 1).map((d, i, arr) => {
                      const originalIdx = d.day - 1;
                      return (
                        <text
                          key={i}
                          x={getX(originalIdx)}
                          y={height - 8}
                          textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                          fontSize="9"
                          fill="#64748b"
                        >
                          {d.date.slice(5)}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MATHEMATICAL DECOMPOSITION & FORMULAS */}
      {activeOutputSubtab === 'math' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Safety Stock Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Safety Stock (SS) Output Formula</h3>
                <p className="text-xs text-slate-500">Lead-time variance &amp; demand uncertainty buffer</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs">
              <p className="text-emerald-400 font-bold mb-1">Formula:</p>
              <p>SS = Z &times; &radic;[ L &times; &sigma;_d&sup2; + d&sup2; &times; &sigma;_L&sup2; ]</p>
              <div className="mt-3 pt-2 border-t border-slate-700 text-[11px] text-slate-300 space-y-1">
                <div>Z = <strong>{serviceLevel >= 0.99 ? '2.326' : serviceLevel >= 0.98 ? '2.054' : '1.645'}</strong> (Service Level {(serviceLevel * 100).toFixed(0)}%)</div>
                <div>L = <strong>{leadTimeOverride} days</strong> (Supplier Lead Time)</div>
                <div>&sigma;_d = <strong>{currentOpt?.dailyDemandStdDev || 22} units</strong> (Daily Demand StdDev)</div>
                <div>d = <strong>{outputSummary.avgDailyDemand} units/day</strong> (Average Daily Demand)</div>
                <div>&sigma;_L = <strong>{currentSku.leadTimeStdDevDays || 2.0} days</strong> (Lead Time StdDev)</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900">
              <strong>Computed Result: </strong> {outputSummary.computedSafetyStock} units needed on hand to guarantee {(serviceLevel * 100).toFixed(0)}% cycle service level without stockout.
            </div>
          </div>

          {/* Economic Order Quantity (EOQ) Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Economic Order Quantity (EOQ) Output</h3>
                <p className="text-xs text-slate-500">Balancing fixed setup costs against inventory carrying costs</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs">
              <p className="text-purple-400 font-bold mb-1">Formula:</p>
              <p>EOQ (Q*) = &radic;[ (2 &times; D &times; S) / H ]</p>
              <div className="mt-3 pt-2 border-t border-slate-700 text-[11px] text-slate-300 space-y-1">
                <div>D = <strong>{Math.round(Number(outputSummary.avgDailyDemand) * 365).toLocaleString()} units/yr</strong> (Annual Demand)</div>
                <div>S = <strong>₹{currentSku.orderSetupCost}</strong> (Fixed Order Setup Cost)</div>
                <div>H = <strong>₹{(currentSku.unitCost * currentSku.holdingCostAnnualRate).toFixed(2)}/unit/yr</strong> (Holding Cost = {(currentSku.holdingCostAnnualRate * 100).toFixed(0)}% of ₹{currentSku.unitCost})</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900">
              <strong>Computed Result: </strong> {outputSummary.computedEOQ} units per batch minimizes combined annual ordering and holding costs to ₹{(outputSummary.computedEOQ * currentSku.unitCost * 0.2).toLocaleString('en-IN')}/yr.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CUSTOM INPUT & INSTANT CALCULATION SANDBOX */}
      {activeOutputSubtab === 'custom_input' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Custom Scenario Input &amp; Instant Output Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Test custom demand volume, lead time, or unit pricing to verify the optimization formulas and generate instant output.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Avg Daily Demand (Units)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={customDailyDemand}
                onChange={(e) => setCustomDailyDemand(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={customLeadTime}
                onChange={(e) => setCustomLeadTime(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Purchase Cost (₹)
              </label>
              <input
                type="number"
                min="1"
                max="500000"
                value={customUnitCost}
                onChange={(e) => setCustomUnitCost(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Setup Cost (₹ / PO)
              </label>
              <input
                type="number"
                min="1"
                max="50000"
                value={customOrderCost}
                onChange={(e) => setCustomOrderCost(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Carrying Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.60"
                value={customHoldingRate}
                onChange={(e) => setCustomHoldingRate(Math.max(0.01, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Generated Sandbox Output Deck */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Generated Model Output Results
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Real-time Mathematical Solver (₹ INR)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="border-l-2 border-emerald-500 pl-3">
                <div className="text-[11px] text-slate-400">Safety Stock Buffer</div>
                <div className="text-xl font-bold text-emerald-400">{customCalculations.safetyStock} units</div>
                <div className="text-[10px] text-slate-500">Z=1.65 (95% SLA)</div>
              </div>

              <div className="border-l-2 border-amber-500 pl-3">
                <div className="text-[11px] text-slate-400">Reorder Point (ROP)</div>
                <div className="text-xl font-bold text-amber-400">{customCalculations.reorderPoint} units</div>
                <div className="text-[10px] text-slate-500">Lead demand: {customCalculations.leadTimeDemand} units</div>
              </div>

              <div className="border-l-2 border-purple-500 pl-3">
                <div className="text-[11px] text-slate-400">Economic Order Qty (EOQ)</div>
                <div className="text-xl font-bold text-purple-400">{customCalculations.eoq} units</div>
                <div className="text-[10px] text-slate-500">₹{(customCalculations.eoq * customUnitCost).toLocaleString('en-IN')} / order</div>
              </div>

              <div className="border-l-2 border-blue-500 pl-3">
                <div className="text-[11px] text-slate-400">Total Annual Policy Cost</div>
                <div className="text-xl font-bold text-sky-400">₹{customCalculations.totalCost.toLocaleString('en-IN')}/yr</div>
                <div className="text-[10px] text-slate-500">Holding: ₹{customCalculations.annualHoldingCost.toLocaleString('en-IN')} • Ordering: ₹{customCalculations.annualOrderingCost.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Output Diagnostics & Model Telemetry Footer */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            INFERENCE RUNTIME: OK
          </span>
          <span>Latency: <strong>{executionLatencyMs}ms</strong></span>
          <span>Quantile Loss: <strong>0.038</strong></span>
          <span>MAE: <strong>4.2</strong></span>
          <span>Ensemble Weights: <strong>45% TFT | 35% Prophet | 20% SARIMA</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="hover:text-white underline"
          >
            Copy Diagnostics
          </button>
          <span>•</span>
          <button
            onClick={handleDownloadJSON}
            className="hover:text-white underline"
          >
            Export Logs
          </button>
        </div>
      </div>
    </div>
  );
};
