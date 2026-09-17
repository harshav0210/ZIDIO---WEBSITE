import React, { useState } from 'react';
import {
  RAW_SALES_DAILY,
  RAW_SKU_MASTER,
  RAW_CALENDAR,
  RAW_INVENTORY_SNAPSHOTS,
  PIPELINE_EXECUTION_LOGS,
  PipelineExecutionLog,
} from '../data/northbayDatasets';
import { formatINR } from '../utils/inventoryCalculations';
import {
  Database,
  Table,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Code2,
  Sliders,
  CheckCheck,
  Calendar,
  Sparkles,
  Search,
} from 'lucide-react';

export const DataPipelineView: React.FC = () => {
  const [activeTableTab, setActiveTableTab] = useState<'sales' | 'sku' | 'calendar' | 'inventory'>('sales');
  const [searchFilter, setSearchFilter] = useState('');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<PipelineExecutionLog[]>(PIPELINE_EXECUTION_LOGS);
  const [lastPipelineRunTime, setLastPipelineRunTime] = useState('2026-09-16 05:30:25');

  // Trigger simulated reproducible pipeline run
  const handleRerunPipeline = () => {
    setIsRunningPipeline(true);
    setTimeout(() => {
      setIsRunningPipeline(false);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setLastPipelineRunTime(nowStr);
      setExecutionLogs([
        {
          timestamp: nowStr,
          stage: '1. Ingestion & Schema Profiling',
          recordsProcessed: 2480,
          status: 'completed',
          details: 'Ingested raw CSVs: sales_daily, sku_master, calendar, inventory_snapshots.',
        },
        {
          timestamp: nowStr,
          stage: '2. Missing Values & Type Normalization',
          recordsProcessed: 2480,
          status: 'completed',
          details: 'Cleaned 14 nulls, cast dates to ISO-8601, aligned INR price decimals.',
        },
        {
          timestamp: nowStr,
          stage: '3. Duplicate & Integrity Scrubbing',
          recordsProcessed: 2462,
          status: 'completed',
          details: 'Purged 18 duplicate transaction rows; normalized negative return units.',
        },
        {
          timestamp: nowStr,
          stage: '4. Feature Engineering & Lag Generation',
          recordsProcessed: 2412,
          status: 'completed',
          details: 'Computed 7d/14d lags, 28d rolling volatility, promo calendar flags.',
        },
        {
          timestamp: nowStr,
          stage: '5. Rolling-Origin Backtest & Artifact Store',
          recordsProcessed: 2412,
          status: 'completed',
          details: 'Verified against Seasonal-Naive baseline; pipeline ready for scoring.',
        },
      ]);
    }, 1200);
  };

  return (
    <div id="data-pipeline-view" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Data Pipeline &amp; Star Schema (Deliverable D1)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-sky-200">
                  Section 05 &amp; 06 · Reproducible Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated ingestion and cleaning of the four client data extracts for NorthBay Living.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block text-xs">
              <span className="text-slate-400 block text-[11px]">Last Pipeline Run:</span>
              <span className="font-mono font-bold text-slate-700">{lastPipelineRunTime}</span>
            </div>

            <button
              onClick={handleRerunPipeline}
              disabled={isRunningPipeline}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
              <span>{isRunningPipeline ? 'Executing Pipeline...' : 'Run Pipeline (1-Command)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Star Schema Architecture Card (Figure 2 in PDF) */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-sky-100 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Figure 2: Star Schema Data Architecture
            </h3>
          </div>
          <span className="text-[11px] text-blue-700 font-medium">
            1 Transactional Fact Table joined to 3 Dimension / Snapshot Entities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Table 1: sku_master */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
            <div className="flex items-center justify-between font-sans">
              <span className="font-bold text-blue-900">sku_master (dim)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-sky-200 text-blue-800">200 SKUs</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="text-blue-700 font-bold">• sku_id (PK)</div>
              <div>category / subcategory</div>
              <div>launch_date</div>
              <div>unit_cost / list_price</div>
            </div>
          </div>

          {/* Table 2: sales_daily (Fact) */}
          <div className="p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/50 space-y-2 relative">
            <div className="absolute -top-2.5 left-3 px-2 py-0.2 rounded-full bg-blue-600 text-white font-sans text-[9px] font-bold uppercase tracking-wider">
              Core Fact Table
            </div>
            <div className="flex items-center justify-between font-sans mt-1">
              <span className="font-bold text-blue-900">sales_daily (fact)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-blue-200 text-blue-900">12,480 rows</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-700 font-semibold">
              <div className="text-blue-700">• date (FK &rarr; calendar)</div>
              <div className="text-blue-700">• sku_id (FK &rarr; sku_master)</div>
              <div>units_sold</div>
              <div>revenue (₹ INR)</div>
              <div>unit_price</div>
              <div>promo_flag (0/1)</div>
            </div>
          </div>

          {/* Table 3: calendar */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
            <div className="flex items-center justify-between font-sans">
              <span className="font-bold text-blue-900">calendar (dim)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-sky-200 text-blue-800">365 days</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="text-blue-700 font-bold">• date (PK)</div>
              <div>week / month / season</div>
              <div>is_holiday (0/1)</div>
              <div>promo_event (Named)</div>
            </div>
          </div>

          {/* Table 4: inventory_snapshots */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
            <div className="flex items-center justify-between font-sans">
              <span className="font-bold text-blue-900">inventory_snapshots</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-sky-200 text-blue-800">Weekly Snapshots</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="text-blue-700 font-bold">• date / sku_id</div>
              <div>on_hand_units</div>
              <div>on_order_units</div>
              <div>lead_time_days</div>
              <div>reorder_point</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Cleaning Execution Logs & Quality Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-time Execution Stages */}
        <div className="lg:col-span-2 bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Reproducible Pipeline Execution Stages (Acceptance Criteria D1)</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All 5 Stages Verified
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {executionLogs.map((log, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{log.stage}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-blue-700 font-bold">
                    {log.recordsProcessed.toLocaleString()} records
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{log.timestamp.split(' ')[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Data Quality Health Card */}
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-sky-100 pb-2">
              Data Quality Audit Scores
            </h3>
            <div className="space-y-3 mt-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Completeness (Zero Nulls in Fact):</span>
                  <span className="font-mono font-bold text-emerald-700">99.8%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[99.8%] h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Uniqueness (Zero Duplicate PKs):</span>
                  <span className="font-mono font-bold text-emerald-700">100.0%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Referential Integrity (Foreign Keys):</span>
                  <span className="font-mono font-bold text-emerald-700">100.0%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Price Consistency vs SKU Master:</span>
                  <span className="font-mono font-bold text-emerald-700">98.4%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[98.4%] h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-blue-950 space-y-1">
            <span className="font-bold flex items-center gap-1 text-[11px] text-blue-800">
              <CheckCheck className="w-3.5 h-3.5 text-blue-700" /> Reproducibility Check Passed
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              A single Python pipeline script (<code>python src/pipeline.py</code>) cleans and outputs analysis-ready Parquet tables.
            </p>
          </div>
        </div>
      </div>

      {/* Raw Table Inspector & Sample Data Viewer */}
      <div className="bg-white border border-sky-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sky-200 bg-sky-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Table Explorer &amp; Data Inspector
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'sales', label: `sales_daily (${RAW_SALES_DAILY.length} sample rows)` },
              { id: 'sku', label: `sku_master (${RAW_SKU_MASTER.length} rows)` },
              { id: 'calendar', label: `calendar (${RAW_CALENDAR.length} rows)` },
              { id: 'inventory', label: `inventory_snapshots (${RAW_INVENTORY_SNAPSHOTS.length} rows)` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTableTab(t.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTableTab === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-[380px]">
          {activeTableTab === 'sales' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">SKU ID</th>
                  <th className="py-2.5 px-3">Units Sold</th>
                  <th className="py-2.5 px-3">Revenue (₹)</th>
                  <th className="py-2.5 px-3">Unit Price (₹)</th>
                  <th className="py-2.5 px-3">Promo Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {RAW_SALES_DAILY.map((r, i) => (
                  <tr key={i} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-4 text-slate-600">{r.date}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{r.sku_id}</td>
                    <td className="py-2.5 px-3 text-slate-800">{r.units_sold}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{formatINR(r.revenue)}</td>
                    <td className="py-2.5 px-3 text-slate-700">{formatINR(r.unit_price)}</td>
                    <td className="py-2.5 px-3">
                      {r.promo_flag === 1 ? (
                        <span className="px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-800 font-bold text-[10px]">
                          1 (Promo Active)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTableTab === 'sku' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">SKU ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Subcategory</th>
                  <th className="py-2.5 px-3">Launch Date</th>
                  <th className="py-2.5 px-3">Unit Cost (₹)</th>
                  <th className="py-2.5 px-3">List Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {RAW_SKU_MASTER.map((r, i) => (
                  <tr key={i} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-4 font-bold text-blue-700">{r.sku_id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">{r.category}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{r.subcategory}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.launch_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{formatINR(r.unit_cost)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{formatINR(r.list_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTableTab === 'calendar' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Season</th>
                  <th className="py-2.5 px-3">Is Holiday</th>
                  <th className="py-2.5 px-3">Promo Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {RAW_CALENDAR.map((r, i) => (
                  <tr key={i} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-4 text-slate-700 font-bold">{r.date}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.week}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.month}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800">{r.season}</td>
                    <td className="py-2.5 px-3">
                      {r.is_holiday ? (
                        <span className="px-1.5 py-0.5 rounded-xs bg-rose-100 text-rose-800 font-bold text-[10px]">
                          1 (Holiday)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-blue-700 font-medium">{r.promo_event || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTableTab === 'inventory' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">SKU ID</th>
                  <th className="py-2.5 px-3">On Hand Units</th>
                  <th className="py-2.5 px-3">On Order Units</th>
                  <th className="py-2.5 px-3">Lead Time (Days)</th>
                  <th className="py-2.5 px-3">Reorder Point (ROP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {RAW_INVENTORY_SNAPSHOTS.map((r, i) => (
                  <tr key={i} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-4 text-slate-600">{r.date}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{r.sku_id}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{r.on_hand_units}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.on_order_units}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.lead_time_days} days</td>
                    <td className="py-2.5 px-3 font-bold text-amber-700">{r.reorder_point} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
