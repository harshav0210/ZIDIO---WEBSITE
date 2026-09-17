import React, { useState, useEffect } from 'react';
import { SKU, Location, PurchaseOrder } from '../types/inventory';
import { formatINR } from '../utils/inventoryCalculations';
import { X, PackageCheck, Truck, Building2, Warehouse } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  skus: SKU[];
  locations: Location[];
  defaultSkuId?: string;
  defaultQuantity?: number;
  onCreatePO: (newPO: PurchaseOrder) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  skus,
  locations,
  defaultSkuId,
  defaultQuantity,
  onCreatePO,
}) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(defaultSkuId || skus[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(defaultQuantity || 250);
  const [shippingMode, setShippingMode] = useState<'standard' | 'expedited'>('standard');

  useEffect(() => {
    if (defaultSkuId) setSelectedSkuId(defaultSkuId);
    if (defaultQuantity) setQuantity(defaultQuantity);
  }, [defaultSkuId, defaultQuantity]);

  if (!isOpen) return null;

  const sku = skus.find((s) => s.id === selectedSkuId) || skus[0];
  const unitCost = sku ? sku.unitCost : 250;
  const totalCost = quantity * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku) return;

    const arrivalDate = new Date();
    const transitDays = shippingMode === 'expedited' ? Math.max(Math.round(sku.supplierLeadTimeDays / 2), 3) : sku.supplierLeadTimeDays;
    arrivalDate.setDate(arrivalDate.getDate() + transitDays);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now().toString().slice(-4)}`,
      poNumber: `PO-IND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      skuId: sku.id,
      skuName: sku.name,
      skuCode: sku.skuCode,
      supplier: sku.supplierName,
      quantity,
      unitCost,
      totalCost,
      locationId: sku.locationId,
      locationName: sku.locationName,
      orderDate: new Date().toISOString().split('T')[0],
      expectedArrivalDate: arrivalDate.toISOString().split('T')[0],
      status: 'approved',
    };

    onCreatePO(newPO);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-sky-200">
        <div className="flex items-center justify-between pb-4 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-blue-700">
              <PackageCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generate Replenishment PO (खरीद आदेश)</h3>
              <p className="text-xs text-slate-500">Demand Drama Automated Procurement Issuance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-sky-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* SKU Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Select SKU / Product Item</label>
            <select
              value={selectedSkuId}
              onChange={(e) => setSelectedSkuId(e.target.value)}
              className="w-full bg-sky-50/50 border border-sky-200 rounded-lg p-2 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.skuCode} — {s.name} ({s.locationName})
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Info Badge */}
          {sku && (
            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-150 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Contracted Supplier:</span>
                <strong className="text-slate-900 font-semibold">{sku.supplierName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Destination Depot:</span>
                <span className="font-semibold text-blue-800">{sku.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Lead Time:</span>
                <span className="font-mono font-semibold">{sku.supplierLeadTimeDays} business days</span>
              </div>
            </div>
          )}

          {/* Quantity & Unit Cost in INR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Batch Quantity (Units)</label>
              <input
                type="number"
                min="10"
                step="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Unit Cost (₹)</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 text-sm">
                ₹{unitCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Shipping Mode */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Logistics &amp; Transport Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShippingMode('standard')}
                className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  shippingMode === 'standard'
                    ? 'border-blue-600 bg-sky-50 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <span>Highway Trucking</span>
                <span className="text-[10px] text-slate-500 font-mono">+{sku.supplierLeadTimeDays}d</span>
              </button>

              <button
                type="button"
                onClick={() => setShippingMode('expedited')}
                className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  shippingMode === 'expedited'
                    ? 'border-blue-600 bg-sky-50 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <span>Express Cargo</span>
                <span className="text-[10px] text-blue-600 font-mono">+{Math.round(sku.supplierLeadTimeDays / 2)}d</span>
              </button>
            </div>
          </div>

          {/* Total Value Summary */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <span className="font-semibold text-blue-900">Total Purchase Commitment (INR):</span>
            <span className="font-mono text-base font-bold text-blue-950">
              {formatINR(totalCost)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Approve &amp; Issue PO (₹)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
