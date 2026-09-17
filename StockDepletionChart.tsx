import React, { useMemo } from 'react';
import { AlertCircle, ArrowDownRight, ShieldCheck, Truck } from 'lucide-react';

interface StockDepletionChartProps {
  currentStock: number;
  inTransitStock: number;
  dailyAvgDemand: number;
  reorderPoint: number;
  safetyStock: number;
  leadTimeDays: number;
  recommendedOrderQuantity: number;
  simulateReplenishment: boolean;
}

export const StockDepletionChart: React.FC<StockDepletionChartProps> = ({
  currentStock,
  inTransitStock,
  dailyAvgDemand,
  reorderPoint,
  safetyStock,
  leadTimeDays,
  recommendedOrderQuantity,
  simulateReplenishment,
}) => {
  // 30 days projection
  const days = 30;

  const trajectory = useMemo(() => {
    let stock = currentStock;
    const points = [];
    let stockoutDay: number | null = null;
    let crossedROPDay: number | null = null;

    for (let day = 0; day <= days; day++) {
      if (day > 0) {
        stock = stock - dailyAvgDemand;
      }

      // If replenishment is simulated, order arrives after leadTimeDays
      if (simulateReplenishment && day === leadTimeDays) {
        stock += recommendedOrderQuantity;
      }

      // If in transit arrives at day 4
      if (inTransitStock > 0 && day === 4) {
        stock += inTransitStock;
      }

      const clampedStock = Math.max(Math.round(stock), 0);

      if (clampedStock <= 0 && stockoutDay === null) {
        stockoutDay = day;
      }

      if (clampedStock <= reorderPoint && crossedROPDay === null) {
        crossedROPDay = day;
      }

      points.push({
        day,
        stock: clampedStock,
      });
    }

    return { points, stockoutDay, crossedROPDay };
  }, [currentStock, inTransitStock, dailyAvgDemand, reorderPoint, leadTimeDays, recommendedOrderQuantity, simulateReplenishment]);

  const maxVal = Math.max(
    currentStock + (simulateReplenishment ? recommendedOrderQuantity : inTransitStock),
    reorderPoint * 1.35,
    100
  );

  const width = 600;
  const height = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const getX = (day: number) => padL + (day / days) * innerW;
  const getY = (val: number) => padT + innerH - (val / maxVal) * innerH;

  const linePath = trajectory.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day).toFixed(1)},${getY(p.stock).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(days)},${padT + innerH} L ${padL},${padT + innerH} Z`;

  return (
    <div id="stock-depletion-chart" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Stock Depletion &amp; Replenishment Horizon (30 Days)
          </h4>
        </div>
        {trajectory.stockoutDay !== null ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Stockout in {trajectory.stockoutDay} days!
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Runway &gt; 30 Days
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        <defs>
          <linearGradient id="depleteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line x1={padL} y1={getY(0)} x2={width - padR} y2={getY(0)} stroke="#cbd5e1" strokeWidth="1" />

        {/* Safety Stock line */}
        <line
          x1={padL}
          y1={getY(safetyStock)}
          x2={width - padR}
          y2={getY(safetyStock)}
          stroke="#f43f5e"
          strokeDasharray="3,3"
          strokeWidth="1.2"
        />
        <text x={padL + 4} y={getY(safetyStock) - 4} className="text-[9px] fill-rose-600 font-mono">
          Safety Stock: {safetyStock}
        </text>

        {/* Reorder Point line */}
        <line
          x1={padL}
          y1={getY(reorderPoint)}
          x2={width - padR}
          y2={getY(reorderPoint)}
          stroke="#f59e0b"
          strokeDasharray="4,4"
          strokeWidth="1.2"
        />
        <text x={padL + 4} y={getY(reorderPoint) - 4} className="text-[9px] fill-amber-700 font-mono">
          ROP Trigger: {reorderPoint}
        </text>

        {/* Lead time marker */}
        {simulateReplenishment && (
          <g>
            <line
              x1={getX(leadTimeDays)}
              y1={padT}
              x2={getX(leadTimeDays)}
              y2={padT + innerH}
              stroke="#10b981"
              strokeDasharray="2,2"
              strokeWidth="1"
            />
            <text x={getX(leadTimeDays)} y={padT - 4} textAnchor="middle" className="text-[9px] fill-emerald-700 font-medium">
              PO Arrives (Day {leadTimeDays})
            </text>
          </g>
        )}

        {/* Depletion Area & Line */}
        <path d={areaPath} fill="url(#depleteGrad)" />
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />

        {/* X axis labels */}
        {[0, 5, 10, 15, 20, 25, 30].map((d) => (
          <g key={d}>
            <line x1={getX(d)} y1={padT + innerH} x2={getX(d)} y2={padT + innerH + 4} stroke="#94a3b8" />
            <text x={getX(d)} y={padT + innerH + 15} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
              d+{d}
            </text>
          </g>
        ))}

        {/* Y ticks */}
        {[0, Math.round(maxVal / 2), Math.round(maxVal)].map((v) => (
          <text key={v} x={padL - 6} y={getY(v) + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            {v}
          </text>
        ))}
      </svg>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-1 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          Lead Time: <strong>{leadTimeDays} days</strong>
        </span>
        <span>
          Daily Outflow: <strong>{dailyAvgDemand} units/day</strong>
        </span>
        <span>
          Current Stock: <strong>{currentStock} units</strong>
        </span>
      </div>
    </div>
  );
};
