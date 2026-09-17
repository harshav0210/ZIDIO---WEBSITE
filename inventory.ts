export type StockStatus = 'stockout_risk' | 'low' | 'healthy' | 'overstock';

export type RiskQuadrant = 'reorder_now' | 'markdown_clear' | 'watch_volatile' | 'healthy';

export interface RiskAssessment {
  skuId: string;
  stockoutRiskScore: number; // 0.0 - 1.0 (Y-axis on Figure 6 Decisioning View)
  overstockRiskScore: number; // 0.0 - 1.0 (X-axis on Figure 6 Decisioning View)
  quadrant: RiskQuadrant;
  quadrantLabel: string;
  salesAtRiskINR: number; // Sales at risk from stockout (Rupees)
  capitalLockedINR: number; // Capital locked in overstock (Rupees)
  revenueAtStakeINR: number; // Bubble size on Decisioning Grid
  recommendedAction: string;
  actionDetail: string;
  projectedDepletionDays: number;
}

export interface WeeklyForecastPoint {
  weekIndex: number;
  weekLabel: string;
  startDate: string;
  actual: number | null;
  seasonalNaive: number; // Seasonal-naive baseline (the bar to beat)
  modelForecast: number; // Model forecast
  p10: number; // 80% interval lower
  p90: number; // 80% interval upper
  isPromo: boolean;
  isHoliday: boolean;
}

export type AnomalyType = 'spike' | 'dead_stock' | 'seasonal_shift' | 'lead_time_drift' | 'price_sensitivity';

export type ModelType = 'ensemble' | 'prophet' | 'sarima' | 'lstm';

export interface Location {
  id: string;
  name: string;
  code: string;
  type: 'central_hub' | 'fulfillment_center' | 'retail_store';
  city: string;
  capacity: number;
  currentUnits: number;
}

export interface HistoricalSalePoint {
  date: string;
  unitsSold: number;
  promotionsActive: boolean;
  holiday: boolean;
  unitPrice: number;
}

export interface ForecastPoint {
  date: string;
  actual: number | null;
  p50: number; // median forecast
  p10: number; // lower confidence bound
  p90: number; // upper confidence bound
  prophet: number;
  sarima: number;
  lstm: number;
  seasonalNaive?: number;
  promotionActive: boolean;
  holiday: boolean;
  projectedStock?: number;
}

export interface SKU {
  id: string;
  skuCode: string;
  name: string;
  category: 'Furnishings' | 'Décor' | 'Small Appliances' | 'Bedding & Linens' | 'Kitchen & Dining' | string;
  subcategory?: string;
  description: string;
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  inTransitStock: number;
  locationId: string;
  locationName: string;
  supplierName: string;
  supplierLeadTimeDays: number;
  leadTimeStdDevDays: number;
  orderSetupCost: number; // S in EOQ (INR per order)
  holdingCostAnnualRate: number; // % of unit cost (e.g. 0.20 = 20%)
  targetServiceLevel: number; // e.g. 0.95 (95%)
  historicalSales: HistoricalSalePoint[];
  forecasts: ForecastPoint[];
  weeklyForecasts?: WeeklyForecastPoint[];
  riskAssessment?: RiskAssessment;
  anomaly?: {
    title?: string;
    type: AnomalyType;
    severity: 'high' | 'medium' | 'low';
    score: number; // 0 - 100
    description: string;
    detectedDate: string;
    rootCause: string;
    recommendedAction: string;
  };
}

export interface SalesDailyRecord {
  date: string;
  sku_id: string;
  units_sold: number;
  revenue: number;
  unit_price: number;
  promo_flag: number;
}

export interface SkuMasterRecord {
  sku_id: string;
  category: string;
  subcategory: string;
  launch_date: string;
  unit_cost: number;
  list_price: number;
}

export interface CalendarRecord {
  date: string;
  week: number;
  month: number;
  season: string;
  is_holiday: number;
  promo_event: string | null;
}

export interface InventorySnapshotRecord {
  date: string;
  sku_id: string;
  on_hand_units: number;
  on_order_units: number;
  lead_time_days: number;
  reorder_point: number;
}

export interface InventoryOptimizationMetrics {
  skuId: string;
  dailyDemandAvg: number;
  dailyDemandStdDev: number;
  annualDemand: number;
  zScore: number;
  safetyStock: number;
  leadTimeDemand: number;
  reorderPoint: number;
  eoq: number;
  recommendedOrderQuantity: number;
  daysOfSupply: number;
  stockoutRiskPercent: number;
  annualHoldingCost: number;
  annualOrderingCost: number;
  totalAnnualCost: number;
  status: StockStatus;
  runwayDays: number;
  stockoutDateEstimate: string | null;
}

export interface ModelPerformanceMetric {
  modelName: ModelType;
  displayName: string;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error (%)
  bias: number; // Forecast Bias
  trainingTimeSec: number;
  recommendedFor: string;
}

export interface AnomalyAlert {
  id: string;
  skuId: string;
  skuName: string;
  skuCode: string;
  locationName: string;
  type: AnomalyType;
  severity: 'high' | 'medium' | 'low';
  score: number;
  title: string;
  metricValue: string;
  threshold: string;
  date: string;
  rootCause: string;
  recommendedAction: string;
  actionTaken?: boolean;
}

export interface MultiEchelonTransfer {
  id: string;
  skuId: string;
  skuName: string;
  skuCode: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  transferQuantity: number;
  estimatedTransitDays: number;
  reason: string;
  savingsVsSupplierRush: number;
  status: 'recommended' | 'approved' | 'in_transit' | 'completed';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  skuId: string;
  skuName: string;
  skuCode: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  locationId: string;
  locationName: string;
  orderDate: string;
  expectedArrivalDate: string;
  status: 'draft' | 'approved' | 'shipped' | 'received';
}

export interface ScenarioParams {
  demandShockPct: number; // e.g. +20%
  supplierDelayDays: number; // e.g. +5 days
  priceChangePct: number; // e.g. -10%
  holidaySurge: boolean;
  promotionActive: boolean;
}

export interface PolicyEvaluationResult {
  metric: string;
  naivePolicyValue: string;
  mlPolicyValue: string;
  improvement: string;
  impactType: 'positive' | 'neutral';
  explanation: string;
}
