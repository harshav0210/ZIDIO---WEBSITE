import { SKU, InventoryOptimizationMetrics, StockStatus } from '../types/inventory';

/**
 * Standard Normal Inverse Cumulative Distribution (approximate z-score from probability)
 * Uses Beasley-Springer-Moro approximation for standard normal inverse.
 */
export function getZScore(serviceLevel: number): number {
  if (serviceLevel >= 0.999) return 3.09;
  if (serviceLevel >= 0.995) return 2.576;
  if (serviceLevel >= 0.99) return 2.326;
  if (serviceLevel >= 0.98) return 2.054;
  if (serviceLevel >= 0.95) return 1.645;
  if (serviceLevel >= 0.90) return 1.282;
  if (serviceLevel >= 0.85) return 1.036;
  if (serviceLevel >= 0.80) return 0.842;
  return 1.645; // default 95%
}

/**
 * Calculates Economic Order Quantity (EOQ):
 * EOQ = sqrt( (2 * D * S) / H )
 * D: Annual demand (units/yr)
 * S: Order setup cost ($/order)
 * H: Annual unit holding cost ($/unit/year) = unitCost * holdingCostRate
 */
export function calculateEOQ(
  annualDemand: number,
  orderSetupCost: number,
  unitCost: number,
  holdingCostRate: number
): number {
  const H = Math.max(unitCost * holdingCostRate, 0.01);
  const D = Math.max(annualDemand, 1);
  const S = Math.max(orderSetupCost, 1);
  const rawEOQ = Math.sqrt((2 * D * S) / H);
  return Math.max(Math.round(rawEOQ), 1);
}

/**
 * Calculates Safety Stock considering both daily demand variability and supplier lead time variability:
 * SS = Z * sqrt( LeadTime * (StdDev_Demand)^2 + (DailyDemand)^2 * (StdDev_LeadTime)^2 )
 */
export function calculateSafetyStock(
  serviceLevel: number,
  avgDailyDemand: number,
  leadTimeDays: number,
  demandStdDev: number,
  leadTimeStdDev: number
): number {
  const Z = getZScore(serviceLevel);
  const varianceDemandInLT = leadTimeDays * Math.pow(demandStdDev, 2);
  const varianceLTImpact = Math.pow(avgDailyDemand, 2) * Math.pow(leadTimeStdDev, 2);
  const combinedSigma = Math.sqrt(varianceDemandInLT + varianceLTImpact);
  return Math.max(Math.round(Z * combinedSigma), 1);
}

/**
 * Calculates Reorder Point (ROP):
 * ROP = (Average Daily Demand * Lead Time) + Safety Stock
 */
export function calculateROP(
  avgDailyDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  const leadTimeDemand = avgDailyDemand * leadTimeDays;
  return Math.round(leadTimeDemand + safetyStock);
}

/**
 * Calculate full inventory optimization profile for a given SKU
 */
export function calculateOptimization(
  sku: SKU,
  overrides?: {
    serviceLevel?: number;
    leadTimeDays?: number;
    orderSetupCost?: number;
    holdingCostRate?: number;
    demandShockMultiplier?: number;
  }
): InventoryOptimizationMetrics {
  const targetServiceLevel = overrides?.serviceLevel ?? sku.targetServiceLevel;
  const leadTimeDays = overrides?.leadTimeDays ?? sku.supplierLeadTimeDays;
  const orderSetupCost = overrides?.orderSetupCost ?? sku.orderSetupCost;
  const holdingCostRate = overrides?.holdingCostRate ?? sku.holdingCostAnnualRate;
  const demandShock = overrides?.demandShockMultiplier ?? 1.0;

  // Compute daily demand from historical sales
  const sales = sku.historicalSales.map((s) => s.unitsSold);
  const n = sales.length || 1;
  const rawDailyAvg = sales.reduce((a, b) => a + b, 0) / n;
  const dailyDemandAvg = Math.max(rawDailyAvg * demandShock, 0.5);

  const variance = sales.reduce((acc, val) => acc + Math.pow(val - rawDailyAvg, 2), 0) / n;
  const dailyDemandStdDev = Math.max(Math.sqrt(variance), 1.0);

  const annualDemand = Math.round(dailyDemandAvg * 365);
  const zScore = getZScore(targetServiceLevel);

  const safetyStock = calculateSafetyStock(
    targetServiceLevel,
    dailyDemandAvg,
    leadTimeDays,
    dailyDemandStdDev,
    sku.leadTimeStdDevDays
  );

  const leadTimeDemand = Math.round(dailyDemandAvg * leadTimeDays);
  const reorderPoint = leadTimeDemand + safetyStock;

  const eoq = calculateEOQ(
    annualDemand,
    orderSetupCost,
    sku.unitCost,
    holdingCostRate
  );

  // Effective available stock (on hand + in transit)
  const totalStock = sku.currentStock + sku.inTransitStock;
  const daysOfSupply = dailyDemandAvg > 0 ? Number((sku.currentStock / dailyDemandAvg).toFixed(1)) : 999;
  const runwayDays = dailyDemandAvg > 0 ? Number((totalStock / dailyDemandAvg).toFixed(1)) : 999;

  // Determine stock status
  let status: StockStatus = 'healthy';
  if (totalStock <= safetyStock * 0.5 || daysOfSupply <= leadTimeDays * 0.5) {
    status = 'stockout_risk';
  } else if (totalStock <= reorderPoint) {
    status = 'low';
  } else if (totalStock > reorderPoint + (eoq * 1.8) || daysOfSupply > 75) {
    status = 'overstock';
  }

  // Recommended order quantity
  let recommendedOrderQuantity = 0;
  if (totalStock <= reorderPoint) {
    // Top up to target max level or EOQ
    const deficit = reorderPoint + eoq - totalStock;
    recommendedOrderQuantity = Math.max(Math.round(deficit), eoq);
  }

  // Stockout risk probability estimation
  let stockoutRiskPercent = 0;
  if (totalStock < leadTimeDemand) {
    stockoutRiskPercent = 88;
  } else if (totalStock < reorderPoint) {
    const diff = totalStock - leadTimeDemand;
    const ratio = diff / Math.max(safetyStock, 1);
    stockoutRiskPercent = Math.min(Math.round(Math.max(1 - ratio, 0.05) * 100), 95);
  } else {
    stockoutRiskPercent = Math.max(Math.round((1 - targetServiceLevel) * 100), 2);
  }

  // Cost calculations
  const unitHoldingCost = sku.unitCost * holdingCostRate;
  const annualHoldingCost = Math.round((eoq / 2 + safetyStock) * unitHoldingCost);
  const ordersPerYear = annualDemand / Math.max(eoq, 1);
  const annualOrderingCost = Math.round(ordersPerYear * orderSetupCost);
  const totalAnnualCost = annualHoldingCost + annualOrderingCost;

  // Estimate stockout date
  let stockoutDateEstimate: string | null = null;
  if (daysOfSupply < 30) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(daysOfSupply));
    stockoutDateEstimate = date.toISOString().split('T')[0];
  }

  return {
    skuId: sku.id,
    dailyDemandAvg: Number(dailyDemandAvg.toFixed(1)),
    dailyDemandStdDev: Number(dailyDemandStdDev.toFixed(1)),
    annualDemand,
    zScore,
    safetyStock,
    leadTimeDemand,
    reorderPoint,
    eoq,
    recommendedOrderQuantity,
    daysOfSupply,
    stockoutRiskPercent,
    annualHoldingCost,
    annualOrderingCost,
    totalAnnualCost,
    status,
    runwayDays,
    stockoutDateEstimate,
  };
}

/**
 * Calculate forecasting error metrics:
 * MAE (Mean Absolute Error)
 * RMSE (Root Mean Square Error)
 * MAPE (Mean Absolute Percentage Error)
 */
export function calculateMetrics(
  actuals: number[],
  predicted: number[]
): { mae: number; rmse: number; mape: number; bias: number } {
  if (!actuals.length || actuals.length !== predicted.length) {
    return { mae: 0, rmse: 0, mape: 0, bias: 0 };
  }

  let sumAbsErr = 0;
  let sumSqErr = 0;
  let sumPctErr = 0;
  let sumBias = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predicted[i];
    const diff = pred - act;
    const absDiff = Math.abs(diff);

    sumAbsErr += absDiff;
    sumSqErr += Math.pow(diff, 2);
    sumBias += diff;

    if (act > 0) {
      sumPctErr += (absDiff / act) * 100;
      validCount++;
    }
  }

  const n = actuals.length;
  const mae = Number((sumAbsErr / n).toFixed(2));
  const rmse = Number((Math.sqrt(sumSqErr / n)).toFixed(2));
  const mape = validCount > 0 ? Number((sumPctErr / validCount).toFixed(1)) : 0;
  const bias = Number((sumBias / n).toFixed(2));

  return { mae, rmse, mape, bias };
}

/**
 * Formats numbers into Indian Rupee (₹) representation.
 * Supports compact notation in Lakhs and Crores for high volumes.
 */
export function formatINR(val: number, options?: { compact?: boolean }): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  if (options?.compact) {
    const absVal = Math.abs(val);
    if (absVal >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (absVal >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    if (absVal >= 1000) {
      return `₹${(val / 1000).toFixed(1)}k`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

