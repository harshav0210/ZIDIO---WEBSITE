import React, { useState, useMemo } from 'react';
import { SKU, RiskQuadrant } from '../types/inventory';
import { formatINR } from '../utils/inventoryCalculations';
import {
  Grid,
  AlertOctagon,
  TrendingDown,
  Eye,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  Package,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface DecisioningGridViewProps {
  skus: SKU[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  onNavigateToForecast: (id: string) => void;
  onNavigateToOptimization: (id: string) => void;
  onOpenNewPO: (skuId: string, quantity?: number) => void;
}

export const DecisioningGridView: React.FC<DecisioningGridViewProps> = ({
  skus,
  selectedSkuId,
  onSelectSkuId,
  onNavigateToForecast,
  onNavigateToOptimization,
  onOpenNewPO,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<string>('All');
  const [hoveredSku, setHoveredSku] = useState<SKU | null>(null);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set(skus.map((s) => s.category));
    return ['All', ...Array.from(set)];
  }, [skus]);

  // Filtered SKUs
  const filteredSkus = useMemo(() => {
    return skus.filter((sku) => {
      const catMatch = selectedCategory === 'All' || sku.category === selectedCategory;
      const quadMatch =
        selectedQuadrantFilter === 'All' ||
        sku.riskAssessment?.quadrant === selectedQuadrantFilter;
      return catMatch && quadMatch;
    });
  }, [skus, selectedCategory, selectedQuadrantFilter]);

  // Selected SKU details
  const activeSku = skus.find((s) => s.id === selectedSkuId) || skus[0];

  // Aggregates across all SKUs
  const totalSalesAtRisk = skus.reduce(
    (sum, s) => sum + (s.riskAssessment?.salesAtRiskINR || 0),
    0
  );
  const totalLockedCapital = skus.reduce(
    (sum, s) => sum + (s.riskAssessment?.capitalLockedINR || 0),
    0
  );

  const quadrantCounts = useMemo(() => {
    return {
      reorder_now: skus.filter((s) => s.riskAssessment?.quadrant === 'reorder_now').length,
      markdown_clear: skus.filter((s) => s.riskAssessment?.quadrant === 'markdown_clear').length,
      watch_volatile: skus.filter((s) => s.riskAssessment?.quadrant === 'watch_volatile').length,
      healthy: skus.filter((s) => s.riskAssessment?.quadrant === 'healthy').length,
    };
  }, [skus]);

  // Bubble size helper: scale between 10px and 34px radius
  const maxRevenueStake = Math.max(
    ...skus.map((s) => s.riskAssessment?.revenueAtStakeINR || 100000)
  );

  const getBubbleRadius = (revenue: number) => {
    const minR = 10;
    const maxR = 30;
    const normalized = Math.sqrt(revenue) / Math.sqrt(maxRevenueStake);
    return Math.max(minR, Math.round(minR + (maxR - minR) * normalized));
  };

  const getQuadrantColor = (quadrant?: RiskQuadrant) => {
    switch (quadrant) {
      case 'reorder_now':
        return {
          fill: '#f43f5e', // rose-500
          stroke: '#be123c', // rose-700
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'markdown_clear':
        return {
          fill: '#6366f1', // indigo-500
          stroke: '#4338ca', // indigo-700
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      case 'watch_volatile':
        return {
          fill: '#f59e0b', // amber-500
          stroke: '#b45309', // amber-700
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'healthy':
      default:
        return {
          fill: '#10b981', // emerald-500
          stroke: '#047857', // emerald-700
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
    }
  };

  return (
    <div id="decisioning-grid-view" className="space-y-6">
      {/* Top Header Brief Summary */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <Grid className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  The Decisioning Grid (Section 08 · Figure 6)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-sky-200">
                  Deliverable D4: Risk Scoring &amp; Decisioning
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every SKU placed on a Stockout Risk vs Overstock Risk grid. Bubble size represents revenue at stake in ₹ INR.
              </p>
            </div>
          </div>

          {/* Aggregate Rupee Impact Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-700">Sales at Risk</div>
                <div className="text-xs font-mono font-bold text-rose-900">{formatINR(totalSalesAtRisk)}</div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <div>
                <div className="text-[10px] uppercase font-bold text-indigo-700">Capital Locked</div>
                <div className="text-xs font-mono font-bold text-indigo-900">{formatINR(totalLockedCapital)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Quadrant Selector Tabs */}
      <div className="bg-white border border-sky-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Quadrant:
          </span>
          {[
            { id: 'All', label: `All SKUs (${skus.length})`, color: 'bg-slate-100 text-slate-700' },
            { id: 'reorder_now', label: `Reorder Now (${quadrantCounts.reorder_now})`, color: 'bg-rose-100 text-rose-800' },
            { id: 'markdown_clear', label: `Markdown / Clear (${quadrantCounts.markdown_clear})`, color: 'bg-indigo-100 text-indigo-800' },
            { id: 'watch_volatile', label: `Watch / Volatile (${quadrantCounts.watch_volatile})`, color: 'bg-amber-100 text-amber-800' },
            { id: 'healthy', label: `Healthy (${quadrantCounts.healthy})`, color: 'bg-emerald-100 text-emerald-800' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedQuadrantFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedQuadrantFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-sky-50 text-slate-600 hover:bg-sky-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="grid-cat-picker" className="text-xs font-semibold text-slate-600">
            Category:
          </label>
          <select
            id="grid-cat-picker"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-sky-50/70 border border-sky-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column: Left Interactive 2D Grid (7 cols), Right SKU Inspection & Action Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 2D Decisioning Grid Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-sky-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Stockout Risk vs. Overstock Risk Matrix
            </span>
            <span className="text-[11px] text-slate-500">
              Click any bubble to inspect SKU &amp; trigger action
            </span>
          </div>

          {/* SVG 2D Coordinate Grid */}
          <div className="relative w-full aspect-square max-h-[500px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex items-center justify-center p-2">
            {/* Background 4-Quadrant Shading */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {/* Top-Left: REORDER NOW */}
              <div className="bg-rose-50/40 border-r border-b border-dashed border-slate-300 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wide">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>REORDER NOW</span>
                </div>
                <div className="text-[10px] text-rose-600/80 font-medium">
                  High stockout risk · Low overstock
                </div>
              </div>

              {/* Top-Right: WATCH / VOLATILE */}
              <div className="bg-amber-50/40 border-b border-dashed border-slate-300 p-3 flex flex-col justify-between text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wide">
                  <span>WATCH / VOLATILE</span>
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-[10px] text-amber-600/80 font-medium">
                  High on both · Erratic / investigate
                </div>
              </div>

              {/* Bottom-Left: HEALTHY */}
              <div className="bg-emerald-50/40 border-r border-dashed border-slate-300 p-3 flex flex-col justify-between">
                <div className="text-[10px] text-emerald-700/80 font-medium">
                  Low on both · Optimal balance
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HEALTHY</span>
                </div>
              </div>

              {/* Bottom-Right: MARKDOWN / CLEAR */}
              <div className="bg-indigo-50/40 p-3 flex flex-col justify-between text-right">
                <div className="text-[10px] text-indigo-600/80 font-medium">
                  High overstock · Low stockout
                </div>
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                  <span>MARKDOWN / CLEAR</span>
                  <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* SVG Bubbles */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Coordinate Dividers */}
              <line x1="50" y1="0" x2="50" y2="100" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

              {/* Plot SKUs */}
              {filteredSkus.map((sku) => {
                const stockoutScore = sku.riskAssessment?.stockoutRiskScore ?? 0.2;
                const overstockScore = sku.riskAssessment?.overstockRiskScore ?? 0.2;
                const revenueStake = sku.riskAssessment?.revenueAtStakeINR ?? 100000;

                // Map scores (0 to 1) to SVG coordinates (padding 8% to 92%)
                const cx = 8 + overstockScore * 84;
                const cy = 92 - stockoutScore * 84; // Invert Y because SVG 0 is top
                const r = getBubbleRadius(revenueStake) * 0.16; // Scale down to SVG viewBox

                const isSelected = sku.id === activeSku.id;
                const isHovered = hoveredSku?.id === sku.id;
                const colors = getQuadrantColor(sku.riskAssessment?.quadrant);

                return (
                  <g
                    key={sku.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => onSelectSkuId(sku.id)}
                    onMouseEnter={() => setHoveredSku(sku)}
                    onMouseLeave={() => setHoveredSku(null)}
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 2.5}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Main Bubble */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={colors.fill}
                      fillOpacity={isSelected || isHovered ? 0.9 : 0.65}
                      stroke={isSelected ? '#1e3a8a' : colors.stroke}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />

                    {/* Short SKU label inside/beside bubble */}
                    <text
                      x={cx}
                      y={cy + 0.8}
                      textAnchor="middle"
                      fontSize="2.4"
                      fill="#ffffff"
                      fontWeight="bold"
                      className="pointer-events-none select-none font-mono"
                    >
                      {sku.skuCode.split('-')[1]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredSku && (
              <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-xs text-white p-2.5 rounded-lg shadow-lg text-xs max-w-xs pointer-events-none border border-slate-700 z-20">
                <div className="font-bold text-[11px] text-sky-300">{hoveredSku.name}</div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-mono">
                  {hoveredSku.skuCode} · {hoveredSku.category}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] border-t border-slate-700 pt-1">
                  <span>Stockout Risk: {(hoveredSku.riskAssessment?.stockoutRiskScore || 0) * 100}%</span>
                  <span>Overstock Risk: {(hoveredSku.riskAssessment?.overstockRiskScore || 0) * 100}%</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                  Revenue at Stake: {formatINR(hoveredSku.riskAssessment?.revenueAtStakeINR || 0)}
                </div>
              </div>
            )}
          </div>

          {/* Axis Labels */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-2 mt-2">
            <span>&larr; Low Overstock Risk</span>
            <span className="uppercase tracking-wider font-bold text-slate-700">Overstock Risk (X-Axis) &rarr;</span>
            <span>High Overstock Risk &rarr;</span>
          </div>
        </div>

        {/* Right Column: Selected SKU Inspection & Action Execution (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Header with Quadrant Badge */}
            <div className="flex items-start justify-between gap-3 border-b border-sky-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 text-blue-800">
                  {activeSku.skuCode}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{activeSku.name}</h3>
                <span className="text-xs text-slate-500">{activeSku.category} · {activeSku.subcategory}</span>
              </div>

              {activeSku.riskAssessment && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wide shrink-0 ${
                    getQuadrantColor(activeSku.riskAssessment.quadrant).badge
                  }`}
                >
                  {activeSku.riskAssessment.quadrant.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Risk Scores Breakdown Bar */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-slate-600 font-medium">Stockout Probability</span>
                <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">
                  {Math.round((activeSku.riskAssessment?.stockoutRiskScore || 0) * 100)}%
                </div>
                <span className="text-[10px] text-rose-600">Runway: {activeSku.riskAssessment?.projectedDepletionDays} days</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-slate-600 font-medium">Overstock Probability</span>
                <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">
                  {Math.round((activeSku.riskAssessment?.overstockRiskScore || 0) * 100)}%
                </div>
                <span className="text-[10px] text-indigo-600">Target buffer: 30-45d</span>
              </div>
            </div>

            {/* Rupee Impact Highlight */}
            <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Sales at Risk from Stockout:</span>
                <span className="font-mono font-bold text-rose-700">
                  {formatINR(activeSku.riskAssessment?.salesAtRiskINR || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Capital Locked in Overstock:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {formatINR(activeSku.riskAssessment?.capitalLockedINR || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-sky-200 pt-1.5 font-bold">
                <span className="text-slate-800">Total Revenue at Stake (Bubble):</span>
                <span className="font-mono text-blue-900">
                  {formatINR(activeSku.riskAssessment?.revenueAtStakeINR || 0)}
                </span>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Operational Action</span>
              </div>
              <p className="text-slate-100 font-semibold leading-relaxed">
                {activeSku.riskAssessment?.recommendedAction}
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {activeSku.riskAssessment?.actionDetail}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {activeSku.riskAssessment?.quadrant === 'reorder_now' && (
                <button
                  onClick={() => onOpenNewPO(activeSku.id, 120)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Raise Replenishment PO Now &rarr;</span>
                </button>
              )}

              {activeSku.riskAssessment?.quadrant === 'markdown_clear' && (
                <button
                  onClick={() => onNavigateToOptimization(activeSku.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Configure 25% Markdown Clearance &rarr;</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigateToForecast(activeSku.id)}
                  className="py-2 px-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-blue-900 font-semibold text-xs transition-colors text-center cursor-pointer"
                >
                  Inspect Forecast &rarr;
                </button>
                <button
                  onClick={() => onNavigateToOptimization(activeSku.id)}
                  className="py-2 px-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-blue-900 font-semibold text-xs transition-colors text-center cursor-pointer"
                >
                  Tune Inventory Parameters &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Section 08 Quadrant Mapping Reference Card */}
          <div className="bg-white border border-sky-200 rounded-xl p-4 text-xs space-y-2.5 shadow-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] block">
              Section 08.2 Quadrant Decisioning Reference Table
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-800">Reorder Now:</span>
                <span className="text-slate-600">Raise replenishment order before stock runs out.</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                <span className="font-bold text-indigo-800">Markdown / Clear:</span>
                <span className="text-slate-600">Promote or discount to free up capital.</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-800">Watch / Volatile:</span>
                <span className="text-slate-600">Investigate — demand is erratic; review manually.</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-800">Healthy:</span>
                <span className="text-slate-600">No action needed; leave as is.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
