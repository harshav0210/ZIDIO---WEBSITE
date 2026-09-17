import React, { useState } from 'react';
import { MultiEchelonTransfer, Location, SKU } from '../types/inventory';
import { formatINR } from '../utils/inventoryCalculations';
import {
  Network,
  ArrowRightLeft,
  Truck,
  CheckCircle2,
  Building2,
  Boxes,
  ShieldCheck,
  Warehouse,
  FileCheck2,
  IndianRupee,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MultiEchelonViewProps {
  transfers: MultiEchelonTransfer[];
  locations: Location[];
  skus: SKU[];
  onApproveTransfer: (transferId: string) => void;
}

export const MultiEchelonView: React.FC<MultiEchelonViewProps> = ({
  transfers,
  locations,
  skus,
  onApproveTransfer,
}) => {
  const [transferList, setTransferList] = useState<MultiEchelonTransfer[]>(transfers);

  const handleApprove = (id: string) => {
    setTransferList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t))
    );
    onApproveTransfer(id);
    try {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  const totalTransferSavings = transferList.reduce(
    (sum, t) => sum + (t.status === 'approved' ? t.savingsVsSupplierRush : 0),
    0
  );

  return (
    <div id="multi-echelon-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Bharat Multi-Echelon Logistics &amp; Stock Transfer
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-blue-700 font-semibold">
                  GST e-Way Bill Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rebalance surplus stock between Indian mega hubs (Bhiwandi, Bilaspur, Hoskote, Sriperumbudur) to prevent stockouts without expensive emergency imports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs text-emerald-800">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>
              Realized Inter-City Freight Savings: <strong>{formatINR(totalTransferSavings)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Network Node Capacity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.filter((l) => l.id !== 'loc-all').map((loc) => {
          const utilPct = Math.round((loc.currentUnits / loc.capacity) * 100);
          return (
            <div key={loc.id} className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold text-blue-700 font-mono tracking-wider">{loc.code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-blue-800 capitalize font-medium border border-sky-100">
                  {loc.type.replace('_', ' ')}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{loc.name}</div>
              <div className="text-xs text-slate-500 mb-3">{loc.city}</div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">Hub Storage Utilization</span>
                  <span className={`font-mono font-bold ${utilPct > 80 ? 'text-amber-700' : 'text-blue-700'}`}>{utilPct}%</span>
                </div>
                <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${utilPct}%` }}
                    className={`h-full ${utilPct > 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono text-right">
                  {loc.currentUnits.toLocaleString('en-IN')} / {loc.capacity.toLocaleString('en-IN')} units
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Network Transfers */}
      <div className="bg-white border border-sky-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sky-100 bg-sky-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recommended Highway Lateral Transfers</h3>
              <p className="text-xs text-slate-500">
                AI matches excess inventory in Western/Northern depots with critical demand surges in South &amp; East.
              </p>
            </div>
          </div>
          <span className="text-xs text-blue-700 font-semibold">
            {transferList.filter((t) => t.status === 'recommended').length} transfers pending approval
          </span>
        </div>

        <div className="divide-y divide-sky-100">
          {transferList.map((xfer) => {
            const isApproved = xfer.status === 'approved';

            return (
              <div key={xfer.id} className="p-4 hover:bg-sky-50/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Origin to Destination Routing */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{xfer.skuName}</span>
                      <span className="text-xs font-mono text-slate-500">({xfer.skuCode})</span>
                    </div>

                    {/* Routing pill */}
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <div className="flex items-center gap-1 text-slate-700 bg-sky-50 border border-sky-150 px-2 py-1 rounded-md">
                        <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                        <span>{xfer.fromLocationName}</span>
                        <span className="text-[10px] text-blue-800 font-bold">(Surplus)</span>
                      </div>
                      <span className="text-blue-500 font-bold">&rarr;</span>
                      <div className="flex items-center gap-1 text-slate-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                        <Warehouse className="w-3.5 h-3.5 text-rose-500" />
                        <span>{xfer.toLocationName}</span>
                        <span className="text-[10px] text-rose-700 font-bold">(Deficit)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{xfer.reason}</p>
                  </div>

                  {/* Transfer Quantities & Financial Benefit in INR */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-2.5 text-center min-w-28">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">Transfer Qty</div>
                      <div className="text-base font-bold text-blue-800 font-mono">
                        {xfer.transferQuantity} units
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <Truck className="w-3 h-3 text-blue-600" /> {xfer.estimatedTransitDays}d Highway Transit
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center min-w-32">
                      <div className="text-emerald-700 text-[10px] uppercase font-semibold">Net Savings (₹)</div>
                      <div className="text-base font-bold text-emerald-800 font-mono">
                        +{formatINR(xfer.savingsVsSupplierRush)}
                      </div>
                      <div className="text-[10px] text-emerald-600">vs supplier rush cost</div>
                    </div>

                    <div className="w-36 text-right">
                      {isApproved ? (
                        <div className="flex items-center justify-end gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>e-Way Bill Dispatched</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApprove(xfer.id)}
                          className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          Approve Transfer &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
