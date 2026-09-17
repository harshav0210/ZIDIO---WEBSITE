import React, { useState, useMemo } from 'react';
import { ForecastPoint, HistoricalSalePoint, ModelType } from '../../types/inventory';
import { Calendar, Tag, Sparkles, TrendingUp } from 'lucide-react';

interface InteractiveForecastChartProps {
  historical: HistoricalSalePoint[];
  forecasts: ForecastPoint[];
  selectedModel: ModelType;
  showConfidenceInterval: boolean;
  showPromotions: boolean;
  showHolidays: boolean;
  reorderPoint?: number;
  safetyStock?: number;
  currentStock?: number;
}

export const InteractiveForecastChart: React.FC<InteractiveForecastChartProps> = ({
  historical,
  forecasts,
  selectedModel,
  showConfidenceInterval,
  showPromotions,
  showHolidays,
  reorderPoint,
  safetyStock,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    value: number;
    type: 'history' | 'forecast';
    p10?: number;
    p90?: number;
    promo?: boolean;
    holiday?: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Time window: last 30 historical days + 30 forecast days
  const chartData = useMemo(() => {
    const histSubset = historical.slice(-30).map((h) => ({
      date: h.date,
      value: h.unitsSold,
      type: 'history' as const,
      p10: undefined,
      p90: undefined,
      promo: h.promotionsActive,
      holiday: h.holiday,
    }));

    const forecastSubset = forecasts.slice(0, 30).map((f) => {
      let val = f.p50;
      if (selectedModel === 'prophet') val = f.prophet;
      else if (selectedModel === 'sarima') val = f.sarima;
      else if (selectedModel === 'lstm') val = f.lstm;

      return {
        date: f.date,
        value: val,
        type: 'forecast' as const,
        p10: f.p10,
        p90: f.p90,
        promo: f.promotionActive,
        holiday: f.holiday,
      };
    });

    return [...histSubset, ...forecastSubset];
  }, [historical, forecasts, selectedModel]);

  const maxVal = useMemo(() => {
    let m = 0;
    chartData.forEach((d) => {
      if (d.value > m) m = d.value;
      if (d.p90 && d.p90 > m) m = d.p90;
    });
    if (reorderPoint && reorderPoint > m) m = reorderPoint;
    return Math.ceil(m * 1.15);
  }, [chartData, reorderPoint]);

  const minVal = 0;

  // Chart dimensions
  const width = 840;
  const height = 300;
  const paddingLeft = 46;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 40;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    return paddingLeft + (index / (chartData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal || 1);
    return paddingTop + innerHeight - norm * innerHeight;
  };

  const historyPoints = chartData.filter((d) => d.type === 'history');
  const forecastPoints = chartData.filter((d) => d.type === 'forecast');

  // Build SVG path for history
  const historyPath = useMemo(() => {
    return historyPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(d.value).toFixed(1)}`)
      .join(' ');
  }, [historyPoints, maxVal]);

  // Connect last history to first forecast
  const lastHistIdx = historyPoints.length - 1;
  const lastHist = historyPoints[lastHistIdx];

  const forecastPath = useMemo(() => {
    if (!lastHist) return '';
    let p = `M ${getX(lastHistIdx).toFixed(1)},${getY(lastHist.value).toFixed(1)}`;
    forecastPoints.forEach((d, i) => {
      const idx = lastHistIdx + 1 + i;
      p += ` L ${getX(idx).toFixed(1)},${getY(d.value).toFixed(1)}`;
    });
    return p;
  }, [forecastPoints, lastHist, lastHistIdx, maxVal]);

  // Confidence Interval Polygon (P10 to P90)
  const confidenceAreaPath = useMemo(() => {
    if (!showConfidenceInterval || !lastHist) return '';
    let upper = `M ${getX(lastHistIdx).toFixed(1)},${getY(lastHist.value).toFixed(1)}`;
    forecastPoints.forEach((d, i) => {
      const idx = lastHistIdx + 1 + i;
      upper += ` L ${getX(idx).toFixed(1)},${getY(d.p90 || d.value).toFixed(1)}`;
    });

    let lower = '';
    for (let i = forecastPoints.length - 1; i >= 0; i--) {
      const d = forecastPoints[i];
      const idx = lastHistIdx + 1 + i;
      lower += ` L ${getX(idx).toFixed(1)},${getY(d.p10 || d.value).toFixed(1)}`;
    }
    lower += ` L ${getX(lastHistIdx).toFixed(1)},${getY(lastHist.value).toFixed(1)} Z`;

    return upper + lower;
  }, [showConfidenceInterval, forecastPoints, lastHist, lastHistIdx, maxVal]);

  const splitX = getX(lastHistIdx);

  // Y-axis grid marks
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  return (
    <div id="forecast-interactive-chart" className="relative w-full overflow-hidden bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">Demand Trajectory &amp; Probabilistic Horizon</h4>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
            60-Day Window (30d Past / 30d Forecast)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-700 inline-block rounded-full"></span>
            <span>Historical Actuals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-600 border-b border-dashed border-indigo-600 inline-block"></span>
            <span className="font-medium text-indigo-700 capitalize">{selectedModel} Forecast</span>
          </div>
          {showConfidenceInterval && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-indigo-100 border border-indigo-200 inline-block rounded-xs"></span>
              <span>P10–P90 Range</span>
            </div>
          )}
          {reorderPoint && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>
              <span className="text-amber-700 font-mono text-[11px]">ROP ({reorderPoint})</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Forecast split vertical line */}
          <line
            x1={splitX}
            y1={paddingTop}
            x2={splitX}
            y2={height - paddingBottom}
            stroke="#94a3b8"
            strokeDasharray="3,3"
            strokeWidth="1.5"
          />
          <text
            x={splitX}
            y={paddingTop - 6}
            textAnchor="middle"
            className="text-[10px] font-medium fill-slate-500 uppercase tracking-wider"
          >
            Today (T₀)
          </text>

          {/* Reorder Point Horizontal Line */}
          {reorderPoint && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(reorderPoint)}
                x2={width - paddingRight}
                y2={getY(reorderPoint)}
                stroke="#f59e0b"
                strokeDasharray="4,4"
                strokeWidth="1.5"
              />
              <text
                x={width - paddingRight + 4}
                y={getY(reorderPoint) + 3}
                className="text-[10px] fill-amber-700 font-mono font-medium"
              >
                ROP
              </text>
            </g>
          )}

          {/* Safety Stock Horizontal Line */}
          {safetyStock && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(safetyStock)}
                x2={width - paddingRight}
                y2={getY(safetyStock)}
                stroke="#ef4444"
                strokeDasharray="2,3"
                strokeWidth="1.2"
                strokeOpacity="0.8"
              />
              <text
                x={width - paddingRight + 4}
                y={getY(safetyStock) + 3}
                className="text-[10px] fill-rose-600 font-mono font-medium"
              >
                SS
              </text>
            </g>
          )}

          {/* Promotions / Holidays background highlight zones */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const w = innerWidth / (chartData.length - 1);
            if (showPromotions && d.promo) {
              return (
                <rect
                  key={`promo-${i}`}
                  x={x - w / 2}
                  y={paddingTop}
                  width={w}
                  height={innerHeight}
                  fill="#fef08a"
                  fillOpacity="0.35"
                />
              );
            }
            if (showHolidays && d.holiday) {
              return (
                <rect
                  key={`hol-${i}`}
                  x={x - w / 2}
                  y={paddingTop}
                  width={w}
                  height={innerHeight}
                  fill="#fbcfe8"
                  fillOpacity="0.35"
                />
              );
            }
            return null;
          })}

          {/* Confidence interval band */}
          {showConfidenceInterval && (
            <path d={confidenceAreaPath} fill="url(#forecastGradient)" stroke="#c7d2fe" strokeWidth="0.5" />
          )}

          {/* History line */}
          <path
            d={historyPath}
            fill="none"
            stroke="#334155"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeDasharray="4,3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points with Hover Interaction */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.value);
            const isForecast = d.type === 'forecast';

            // Show dates on X axis periodically
            const showLabel = i % 8 === 0 || i === chartData.length - 1;

            return (
              <g key={i}>
                {showLabel && (
                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {d.date.slice(5)}
                  </text>
                )}

                {/* Visible dot on hover or specific milestones */}
                <circle
                  cx={x}
                  cy={y}
                  r={hoveredPoint?.date === d.date ? 5 : isForecast ? 2 : 2.5}
                  fill={isForecast ? '#6366f1' : '#334155'}
                  stroke="#ffffff"
                  strokeWidth={hoveredPoint?.date === d.date ? 2 : 1}
                  className="transition-all duration-150 cursor-pointer"
                />

                {/* Event icons on chart */}
                {d.promo && (
                  <circle cx={x} cy={paddingTop + 10} r="3" fill="#eab308" />
                )}
                {d.holiday && (
                  <circle cx={x} cy={paddingTop + 10} r="3" fill="#ec4899" />
                )}

                {/* Invisible hover trigger zone */}
                <rect
                  x={x - (innerWidth / chartData.length) / 2}
                  y={paddingTop}
                  width={innerWidth / chartData.length}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      date: d.date,
                      value: d.value,
                      type: d.type,
                      p10: d.p10,
                      p90: d.p90,
                      promo: d.promo,
                      holiday: d.holiday,
                      x,
                      y,
                    })
                  }
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900/95 text-white p-2.5 rounded-lg shadow-lg text-xs border border-slate-700 min-w-44 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(hoveredPoint.y - 12, 10)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1.5 font-mono text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {hoveredPoint.date}
              </span>
              <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-medium uppercase ${
                hoveredPoint.type === 'history' ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'
              }`}>
                {hoveredPoint.type === 'history' ? 'Actual' : 'Forecast'}
              </span>
            </div>

            <div className="text-base font-bold text-white mb-1">
              {hoveredPoint.value} <span className="text-xs font-normal text-slate-300">units/day</span>
            </div>

            {hoveredPoint.p10 !== undefined && hoveredPoint.p90 !== undefined && (
              <div className="text-[11px] text-indigo-200 flex justify-between gap-2 bg-indigo-950/60 p-1 rounded-xs mb-1">
                <span>P10: <strong>{hoveredPoint.p10}</strong></span>
                <span>P90: <strong>{hoveredPoint.p90}</strong></span>
              </div>
            )}

            {hoveredPoint.promo && (
              <div className="flex items-center gap-1 text-[10px] text-amber-300">
                <Tag className="w-2.5 h-2.5" /> Promotion Active (+35% lift)
              </div>
            )}
            {hoveredPoint.holiday && (
              <div className="flex items-center gap-1 text-[10px] text-pink-300">
                <Sparkles className="w-2.5 h-2.5" /> Holiday Calendar Event
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
