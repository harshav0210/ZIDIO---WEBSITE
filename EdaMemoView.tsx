import React from 'react';
import { formatINR } from '../utils/inventoryCalculations';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PieChart,
  Calendar,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const EdaMemoView: React.FC = () => {
  return (
    <div id="eda-memo-view" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Data-Quality &amp; Exploratory Data Analysis (EDA) Memo
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-sky-200">
                  Deliverable D2 · Section 09 &amp; 14
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client: NorthBay Living (D2C Home &amp; Lifestyle) · Audience: Operations &amp; Merchandising Leads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Passed All Audit Checks
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Data-Quality Audit Findings & Treatment */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            1. Data Quality Issues Identified &amp; Treatment Applied
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">14 Missing Promo Flags</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-800 font-bold">Imputed</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Found null entries in <code>sales_daily.promo_flag</code> during non-festive weeks. Handled by cross-referencing with <code>calendar.promo_event</code> and filling unflagged dates with <code>0</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">18 Duplicate Transactions</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-rose-100 text-rose-800 font-bold">Purged</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Identified exact duplicate rows on the composite key <code>(date, sku_id)</code> caused by multi-channel webhook retry logic. Deduplicated using row-level timestamps.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">4 Negative Unit Sales</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-indigo-100 text-indigo-800 font-bold">Normalized</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Customer RMA return batches logged as negative daily demand artificially distorted moving averages. Segregated into a dedicated returns table to preserve gross demand signals.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Core Business Insights (Mandatory 3 Business-Relevant Insights) */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            2. Core Business Insights from Historical Demand Patterns (Plain Language)
          </h3>
        </div>

        <div className="space-y-3">
          {/* Insight 1 */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Insight #1 · Lead Time Variance is the Primary Driver of Stockouts
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-200 text-rose-900">
                ₹14.8L Lost Revenue Exposure
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Small Appliances (specifically the Barista Touch Espresso Machine and Air Purifier) exhibit high supplier lead time variance (&sigma;<sub>L</sub> &gt; 4.5 days). Because previous spreadsheet ordering assumed a fixed 10-day lead time without stochastic buffers, NorthBay Living suffered repeated 5-to-8 day stockout gaps during transit delays.
            </p>
          </div>

          {/* Insight 2 */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                Insight #2 · Décor &amp; Bedding Inventory Trapped in Chronic Dead Stock
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900">
                ₹20.8L Working Capital Frozen
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Over 35% of total warehouse units in Décor (such as the Fluted Ceramic Artisan Floor Vase) and Bedding (Weighted Calming Blankets) hold more than <strong>140 days of supply</strong> on hand. This excess inventory generates no incremental revenue, ties up valuable pallet racks at the Bhiwandi fulfillment hub, and depresses inventory turnover to 2.1x.
            </p>
          </div>

          {/* Insight 3 */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-sky-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                Insight #3 · Weekend &amp; Festive Lift Spikes 2.4x Beyond Naive Baselines
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-200 text-blue-900">
                +140% Promotional Velocity
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Friday-through-Sunday sales consistently outpace mid-week sales by +38%, and seasonal promotional spikes (e.g. Diwali festive gifting campaigns) produce a 2.4x surge in velocity. A simple seasonal-naive model consistently under-predicts these promotional weeks by 42%, resulting in missed sales right at the peak of marketing ad spend.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Visual Demand Distribution & Seasonality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Day of Week Seasonality Profile */}
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Weekly Day-of-Week Seasonality Curve
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">+38% Weekend Lift</span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {[
              { day: 'Monday', index: 0.88, label: 'Post-weekend drop', color: 'bg-slate-300' },
              { day: 'Tuesday', index: 0.92, label: 'Mid-week baseline', color: 'bg-slate-300' },
              { day: 'Wednesday', index: 0.95, label: 'Steady demand', color: 'bg-slate-300' },
              { day: 'Thursday', index: 1.02, label: 'Pre-weekend ramp', color: 'bg-sky-300' },
              { day: 'Friday', index: 1.25, label: 'Payday & evening orders', color: 'bg-blue-500' },
              { day: 'Saturday', index: 1.48, label: 'Peak browsing & buying', color: 'bg-blue-600' },
              { day: 'Sunday', index: 1.38, label: 'Sustained weekend shopping', color: 'bg-blue-500' },
            ].map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="w-20 text-[11px] font-semibold text-slate-700">{d.day}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full ${d.color} rounded-full`}
                    style={{ width: `${(d.index / 1.6) * 100}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right font-mono font-bold text-slate-800 text-[11px]">
                  {(d.index * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pareto 80/20 Distribution & Category Split */}
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-blue-600" /> Revenue Concentration (Pareto Principle)
            </h4>
            <span className="text-[11px] text-blue-700 font-bold">Top 20% SKUs = 76.4% Revenue</span>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-blue-50/50 border border-sky-200 text-[11px] text-slate-700">
              A classic power-law Pareto curve governs NorthBay Living. Protecting inventory availability on the top 15 revenue-generating SKUs protects <strong>over 75% of net catalog GMV</strong>.
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-700">Small Appliances (High Volume, High Velocity):</span>
                <span className="font-mono font-bold text-blue-900">38.2%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[38.2%] h-full bg-blue-600 rounded-full"></div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-700">Furnishings (High Ticket, Moderate Velocity):</span>
                <span className="font-mono font-bold text-blue-900">28.5%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[28.5%] h-full bg-sky-500 rounded-full"></div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-700">Bedding &amp; Linens (Steady Repeat Buyers):</span>
                <span className="font-mono font-bold text-blue-900">18.4%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[18.4%] h-full bg-indigo-500 rounded-full"></div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-700">Décor &amp; Kitchen (Long Tail / Overstock Risk):</span>
                <span className="font-mono font-bold text-blue-900">14.9%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[14.9%] h-full bg-amber-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
