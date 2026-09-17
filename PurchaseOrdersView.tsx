import React from 'react';
import { PurchaseOrder } from '../types/inventory';
import { formatINR } from '../utils/inventoryCalculations';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  Building2,
  IndianRupee,
} from 'lucide-react';

interface PurchaseOrdersViewProps {
  orders: PurchaseOrder[];
  onOpenCreatePO: () => void;
  onApprovePO: (poId: string) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  orders,
  onOpenCreatePO,
  onApprovePO,
}) => {
  const totalSpend = orders.reduce((sum, o) => sum + o.totalCost, 0);

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Draft PO
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Approved
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-blue-900 border border-sky-200">
            <Truck className="w-3 h-3 text-blue-600" /> On Highway / Transit
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackageCheck className="w-3 h-3 text-emerald-600" /> Stock Received
          </span>
        );
    }
  };

  return (
    <div id="purchase-orders-view" className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Purchase Order Management Hub (खरीद आदेश)</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-blue-700 font-semibold border border-sky-100">
                  {orders.length} Active Orders
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated replenishment POs generated from EOQ calculations and lead-time safety stock triggers across India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600 bg-sky-50/70 border border-sky-200 px-3.5 py-2 rounded-xl">
              Committed Replenishment Capital:{' '}
              <strong className="font-mono text-slate-900 text-sm font-bold">
                {formatINR(totalSpend)}
              </strong>
            </div>
            <button
              onClick={onOpenCreatePO}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New PO (₹)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-sky-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sky-50/60 border-b border-sky-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Product / SKU</th>
                <th className="py-3 px-3">Supplier (आपूर्तिकर्ता)</th>
                <th className="py-3 px-3">Destination Facility</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Total Value (₹)</th>
                <th className="py-3 px-3">Expected Arrival</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{po.poNumber}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-900">{po.skuName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{po.skuCode}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{po.supplier}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{po.locationName}</td>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {po.quantity.toLocaleString('en-IN')} units
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {formatINR(po.totalCost)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">{po.expectedArrivalDate}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {po.status === 'draft' ? (
                      <button
                        onClick={() => onApprovePO(po.id)}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Approve &amp; Dispatch
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Order Dispatched</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
