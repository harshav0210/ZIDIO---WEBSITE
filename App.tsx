import React, { useState, useMemo, useEffect } from 'react';
import {
  LOCATIONS,
  ANOMALY_ALERTS,
  INITIAL_TRANSFERS,
  INITIAL_PURCHASE_ORDERS,
} from './data/mockDatasets';
import { NORTHBAY_SKUS } from './data/northbayDatasets';
import {
  SKU,
  Location,
  AnomalyAlert,
  MultiEchelonTransfer,
  PurchaseOrder,
  ScenarioParams,
  InventoryOptimizationMetrics,
} from './types/inventory';
import { calculateOptimization, formatINR } from './utils/inventoryCalculations';

// Components
import { GoogleLoginView, UserProfile } from './components/GoogleLoginView';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DecisioningGridView } from './components/DecisioningGridView';
import { DemandForecastingView } from './components/DemandForecastingView';
import { InventoryOptimizationView } from './components/InventoryOptimizationView';
import { DataPipelineView } from './components/DataPipelineView';
import { EdaMemoView } from './components/EdaMemoView';
import { ScoringServiceApiView } from './components/ScoringServiceApiView';
import { ExecutiveReadoutView } from './components/ExecutiveReadoutView';
import { OutputInterfaceView } from './components/OutputInterfaceView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { ScenarioSandboxModal } from './components/ScenarioSandboxModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';

// Icons
import {
  LayoutDashboard,
  Grid,
  Presentation,
  Brain,
  Calculator,
  Database,
  FileText,
  Server,
  PackageCheck,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  // Authentication State: Mandatory starting login page as requested
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Navigation: Default to Output Hub (Deliverables & Forecast Results)
  const [activeTab, setActiveTab] = useState<string>('output_hub');

  // Filters
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc-all');
  const [selectedSkuId, setSelectedSkuId] = useState<string>(NORTHBAY_SKUS[0].id);

  // Data state
  const [skus, setSkus] = useState<SKU[]>(NORTHBAY_SKUS);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(ANOMALY_ALERTS);
  const [transfers, setTransfers] = useState<MultiEchelonTransfer[]>(INITIAL_TRANSFERS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);

  // Scenario Simulation Parameters
  const [scenario, setScenario] = useState<ScenarioParams>({
    demandShockPct: 0,
    supplierDelayDays: 0,
    priceChangePct: 0,
    holidaySurge: false,
    promotionActive: false,
  });

  // Modals & Drawers
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [modalSkuTarget, setModalSkuTarget] = useState<string | undefined>(undefined);
  const [modalQtyTarget, setModalQtyTarget] = useState<number | undefined>(undefined);

  // Filtered SKUs based on location selector
  const filteredSkus = useMemo(() => {
    if (selectedLocationId === 'loc-all') return skus;
    return skus.filter((s) => s.locationId === selectedLocationId);
  }, [skus, selectedLocationId]);

  // Compute optimizations for all SKUs (accounting for active scenario)
  const optimizations = useMemo(() => {
    const result: Record<string, InventoryOptimizationMetrics> = {};
    const demandMultiplier =
      1 +
      scenario.demandShockPct / 100 +
      (scenario.promotionActive ? 0.35 : 0) +
      (scenario.holidaySurge ? 0.4 : 0);

    skus.forEach((sku) => {
      result[sku.id] = calculateOptimization(sku, {
        demandShockMultiplier: demandMultiplier,
        leadTimeDays: sku.supplierLeadTimeDays + scenario.supplierDelayDays,
      });
    });
    return result;
  }, [skus, scenario]);

  // Action handlers
  const handleOpenNewPO = (skuId?: string, qty?: number) => {
    setModalSkuTarget(skuId || selectedSkuId);
    setModalQtyTarget(qty || optimizations[skuId || selectedSkuId]?.recommendedOrderQuantity || 120);
    setIsPOModalOpen(true);
  };

  const handleCreatePO = (newPO: PurchaseOrder) => {
    setOrders((prev) => [newPO, ...prev]);

    // Update inTransitStock for this SKU
    setSkus((prev) =>
      prev.map((s) =>
        s.id === newPO.skuId
          ? { ...s, inTransitStock: s.inTransitStock + newPO.quantity }
          : s
      )
    );
  };

  const handleApprovePO = (poId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === poId ? { ...o, status: 'approved' } : o))
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU Code',
      'Name',
      'Category',
      'Location',
      'On Hand Stock',
      'In Transit',
      'Unit Price (INR)',
      'Daily Demand',
      'Safety Stock',
      'ROP',
      'EOQ',
      'Runway Days',
      'Risk Quadrant',
      'Sales at Risk (INR)',
      'Capital Locked (INR)',
      'Action Detail',
    ];

    const rows = skus.map((s) => {
      const opt = optimizations[s.id];
      const risk = s.riskAssessment;
      return [
        s.skuCode,
        `"${s.name}"`,
        s.category,
        `"${s.locationName}"`,
        s.currentStock,
        s.inTransitStock,
        s.sellingPrice,
        opt?.dailyDemandAvg || 0,
        opt?.safetyStock || 0,
        opt?.reorderPoint || 0,
        opt?.economicOrderQuantity || 0,
        risk?.projectedDepletionDays || opt?.daysOfSupply || 0,
        risk?.quadrant || 'healthy',
        risk?.salesAtRiskINR || 0,
        risk?.capitalLockedINR || 0,
        `"${risk?.recommendedAction || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `project_foresight_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('demand_drama_user');
    setCurrentUser(null);
  };

  // Stockout count across active SKUs
  const stockoutRiskCount = skus.filter(
    (s) => s.riskAssessment?.quadrant === 'reorder_now'
  ).length;

  const isScenarioActive =
    scenario.demandShockPct !== 0 ||
    scenario.supplierDelayDays !== 0 ||
    scenario.priceChangePct !== 0 ||
    scenario.holidaySurge ||
    scenario.promotionActive;

  // 1. If not logged in, render Google Login Screen
  if (!currentUser) {
    return (
      <GoogleLoginView
        defaultEmail="237r1a66q2@cmrtc.ac.in"
        onLoginSuccess={(user, targetTab) => {
          setCurrentUser(user);
          if (targetTab) {
            setActiveTab(targetTab);
          }
        }}
      />
    );
  }

  // 2. Main Authenticated Project FORESIGHT Application
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50/40 to-blue-50/30 flex flex-col font-sans text-slate-900">
      {/* Top Header */}
      <Header
        locations={LOCATIONS}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenNewPO={() => handleOpenNewPO()}
        onExportData={handleExportCSV}
        onOpenOutput={() => setActiveTab('output_hub')}
        stockoutCount={stockoutRiskCount}
        unresolvedAlertsCount={alerts.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Scenario Active Notice Banner */}
      {isScenarioActive && (
        <div className="bg-sky-100/90 border-b border-sky-200 px-4 py-2 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>
              <strong>Active Simulation Sandbox: </strong>
              {scenario.demandShockPct !== 0 && `Demand Shock: ${scenario.demandShockPct > 0 ? '+' : ''}${scenario.demandShockPct}% • `}
              {scenario.supplierDelayDays !== 0 && `Lead Time Delay: +${scenario.supplierDelayDays}d • `}
              {scenario.promotionActive && `Flash Festive Promo Active (+35%) • `}
              {scenario.holidaySurge && `Diwali/Navratri Surge Active (+40%)`}
            </span>
            <button
              onClick={() =>
                setScenario({
                  demandShockPct: 0,
                  supplierDelayDays: 0,
                  priceChangePct: 0,
                  holidaySurge: false,
                  promotionActive: false,
                })
              }
              className="ml-auto underline font-semibold text-blue-800 hover:text-blue-950 cursor-pointer"
            >
              Reset Simulation
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Navigation Bar for Project FORESIGHT Deliverables */}
      <nav aria-label="Main Navigation" className="bg-white/95 backdrop-blur-xs border-b border-sky-200 sticky top-14 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'decisioning_grid', label: 'Decisioning Grid (Figure 6)', subLabel: 'D4 · 4 Quadrants', icon: Grid, badge: 'Key' },
              { id: 'executive_readout', label: 'Executive Readout', subLabel: 'D7 · 8-Slide Deck', icon: Presentation, badge: 'Deck' },
              { id: 'forecasting', label: 'Demand Forecasting', subLabel: 'D3 · WAPE vs Baseline', icon: Brain },
              { id: 'optimization', label: 'Planning Dashboard', subLabel: 'D5 · Reorder Priorities', icon: Calculator },
              { id: 'data_pipeline', label: 'Data Pipeline & Schema', subLabel: 'D1 · Star Schema', icon: Database },
              { id: 'eda_memo', label: 'EDA Insight Memo', subLabel: 'D2 · Quality & Audit', icon: FileText },
              { id: 'scoring_api', label: 'Scoring Service API', subLabel: 'D6 · Microservice', icon: Server, badge: 'API' },
              { id: 'output_hub', label: 'Output Hub & CSV', subLabel: 'Audit Export', icon: FileSpreadsheet },
              { id: 'purchase_orders', label: 'Purchase Orders', subLabel: 'Procurement', icon: PackageCheck, badge: orders.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-sky-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <div className="text-left leading-tight">
                    <span>{tab.label}</span>
                    <span className={`block text-[9px] font-normal ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                      {tab.subLabel}
                    </span>
                  </div>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-blue-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* View Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Deliverable D4: The Decisioning Grid (Section 08 · Figure 6) */}
        {activeTab === 'decisioning_grid' && (
          <DecisioningGridView
            skus={filteredSkus.length ? filteredSkus : skus}
            selectedSkuId={selectedSkuId}
            onSelectSkuId={setSelectedSkuId}
            onNavigateToForecast={(id) => {
              setSelectedSkuId(id);
              setActiveTab('forecasting');
            }}
            onNavigateToOptimization={(id) => {
              setSelectedSkuId(id);
              setActiveTab('optimization');
            }}
            onOpenNewPO={(skuId, qty) => handleOpenNewPO(skuId, qty)}
          />
        )}

        {/* Deliverable D7: Executive Readout Deck & Memo (Section 09 & 13) */}
        {activeTab === 'executive_readout' && <ExecutiveReadoutView />}

        {/* Deliverable D3: Demand Forecasting Model (Section 07 & 10) */}
        {activeTab === 'forecasting' && (
          <DemandForecastingView
            skus={filteredSkus.length ? filteredSkus : skus}
            selectedSkuId={selectedSkuId}
            onSelectSkuId={setSelectedSkuId}
            onNavigateToOptimization={(skuId) => {
              setSelectedSkuId(skuId);
              setActiveTab('optimization');
            }}
          />
        )}

        {/* Deliverable D5: Planning Dashboard & Inventory Optimization */}
        {activeTab === 'optimization' && (
          <InventoryOptimizationView
            skus={filteredSkus.length ? filteredSkus : skus}
            selectedSkuId={selectedSkuId}
            onSelectSkuId={setSelectedSkuId}
            onOpenNewPO={(skuId, qty) => handleOpenNewPO(skuId, qty)}
          />
        )}

        {/* Deliverable D1: Data Pipeline & Star Schema */}
        {activeTab === 'data_pipeline' && <DataPipelineView />}

        {/* Deliverable D2: EDA Insight Memo & Data Quality */}
        {activeTab === 'eda_memo' && <EdaMemoView />}

        {/* Deliverable D6: Deployed Scoring Service API Testbench */}
        {activeTab === 'scoring_api' && (
          <ScoringServiceApiView
            skus={filteredSkus.length ? filteredSkus : skus}
            onSelectSkuId={setSelectedSkuId}
          />
        )}

        {/* Output Hub & Export */}
        {activeTab === 'output_hub' && (
          <OutputInterfaceView
            skus={filteredSkus.length ? filteredSkus : skus}
            optimizations={optimizations}
            selectedSkuId={selectedSkuId}
            onSelectSkuId={setSelectedSkuId}
            onOpenNewPO={(skuId, qty) => handleOpenNewPO(skuId, qty)}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Purchase Orders */}
        {activeTab === 'purchase_orders' && (
          <PurchaseOrdersView
            orders={orders}
            onOpenCreatePO={() => handleOpenNewPO()}
            onApprovePO={handleApprovePO}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sky-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Project FORESIGHT</span>
            <span>•</span>
            <span className="text-slate-600">NorthBay Living (D2C Home &amp; Lifestyle)</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold">Bhiwandi Central Fulfillment Depot</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> GST e-Way Ready
            </span>
            <span>User: <strong className="text-blue-700">{currentUser.email}</strong></span>
            <span>Reporting Currency: <strong>₹ (INR)</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        skus={skus}
        locations={LOCATIONS}
        defaultSkuId={modalSkuTarget}
        defaultQuantity={modalQtyTarget}
        onCreatePO={handleCreatePO}
      />

      <ScenarioSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        scenario={scenario}
        onUpdateScenario={setScenario}
        onResetScenario={() =>
          setScenario({
            demandShockPct: 0,
            supplierDelayDays: 0,
            priceChangePct: 0,
            holidaySurge: false,
            promotionActive: false,
          })
        }
        skus={filteredSkus}
        optimizations={optimizations}
      />

      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        skus={skus}
        activeSkuId={selectedSkuId}
      />
    </div>
  );
}
