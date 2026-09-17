import { SKU, Location, AnomalyAlert, MultiEchelonTransfer, PurchaseOrder, PolicyEvaluationResult, ModelPerformanceMetric } from '../types/inventory';

export const LOCATIONS: Location[] = [
  {
    id: 'loc-all',
    name: 'All India Logistics Network (Desh-Wide)',
    code: 'ALL-IN',
    type: 'central_hub',
    city: 'Pan-India Grid',
    capacity: 1250000,
    currentUnits: 842500,
  },
  {
    id: 'loc-bhw',
    name: 'Bhiwandi Central Fulfillment Hub',
    code: 'BHW-01',
    type: 'central_hub',
    city: 'Bhiwandi (Mumbai MM)',
    capacity: 350000,
    currentUnits: 245100,
  },
  {
    id: 'loc-del',
    name: 'Bilaspur Logistics Park',
    code: 'DEL-02',
    type: 'central_hub',
    city: 'Bilaspur / Gurugram (NCR)',
    capacity: 280000,
    currentUnits: 198200,
  },
  {
    id: 'loc-blr',
    name: 'Hoskote Quick-Commerce Hub',
    code: 'BLR-03',
    type: 'fulfillment_center',
    city: 'Hoskote / Peenya (Bengaluru)',
    capacity: 180000,
    currentUnits: 128400,
  },
  {
    id: 'loc-maa',
    name: 'Sriperumbudur Mega Depot',
    code: 'MAA-04',
    type: 'fulfillment_center',
    city: 'Sriperumbudur (Chennai)',
    capacity: 190000,
    currentUnits: 135800,
  },
  {
    id: 'loc-ccu',
    name: 'Dankuni Industrial Hub',
    code: 'CCU-05',
    type: 'fulfillment_center',
    city: 'Dankuni (Kolkata)',
    capacity: 140000,
    currentUnits: 82500,
  },
  {
    id: 'loc-hyd',
    name: 'Shamshabad Cargo Depot',
    code: 'HYD-06',
    type: 'retail_store',
    city: 'Shamshabad (Hyderabad)',
    capacity: 130000,
    currentUnits: 52500,
  },
];

// Helper to generate realistic 60 days history + 30 days forecast
function generateTimeSeries(
  baseDemand: number,
  weekendBoost: number,
  trendSlope: number,
  noiseScale: number,
  unitPriceINR: number,
  spikeDayIndex?: number,
  spikeMultiplier?: number
) {
  const history = [];
  const forecasts = [];
  const now = new Date('2026-09-15');

  // 60 days historical
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dayFactor = isWeekend ? weekendBoost : 1.0;
    const trend = 1 + (60 - i) * trendSlope;
    const noise = 1 + (Math.sin(i * 1.7) * 0.15 + (Math.random() - 0.5) * noiseScale);
    let units = Math.round(baseDemand * dayFactor * trend * noise);

    const isPromo = i === 12 || i === 13 || i === 14;
    if (isPromo) units = Math.round(units * 1.45);

    if (spikeDayIndex !== undefined && (60 - i) >= spikeDayIndex && (60 - i) <= spikeDayIndex + 4) {
      units = Math.round(units * (spikeMultiplier || 2.2));
    }

    history.push({
      date: dateStr,
      unitsSold: Math.max(units, 2),
      promotionsActive: isPromo,
      holiday: i === 25 || i === 10,
      unitPrice: unitPriceINR,
    });
  }

  // 30 days forecast (incorporating Indian festive calendar: Diwali, Navratri rush)
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dayFactor = isWeekend ? weekendBoost : 1.0;
    const trend = 1 + (60 + i) * trendSlope;

    const basePredicted = baseDemand * dayFactor * trend;
    // Festive lift (Navratri / Diwali pre-orders)
    const isPromo = i >= 18 && i <= 24;
    const promoMultiplier = isPromo ? 1.4 : 1.0;
    const isHoliday = i === 15 || i === 28;
    const holidayMultiplier = isHoliday ? 1.35 : 1.0;

    const p50 = Math.round(basePredicted * promoMultiplier * holidayMultiplier);
    const p10 = Math.round(p50 * 0.84);
    const p90 = Math.round(p50 * 1.22);

    // Multi-model variations
    const prophet = Math.round(p50 * (1 + Math.sin(i * 0.4) * 0.04));
    const sarima = Math.round(p50 * (1 + (isWeekend ? 0.06 : -0.03)));
    const lstm = Math.round(p50 * (1 + (i > 15 ? 0.05 : -0.02)));

    forecasts.push({
      date: dateStr,
      actual: null,
      p50,
      p10,
      p90,
      prophet,
      sarima,
      lstm,
      promotionActive: isPromo,
      holiday: isHoliday,
    });
  }

  return { history, forecasts };
}

const seriesTata = generateTimeSeries(55, 1.20, 0.003, 0.12, 560);
const seriesBoat = generateTimeSeries(62, 1.35, 0.005, 0.18, 1799, 53, 2.35); // viral festive spike
const seriesFortune = generateTimeSeries(95, 1.15, 0.002, 0.10, 840);
const seriesAashirvaad = generateTimeSeries(88, 1.12, 0.003, 0.09, 475);
const seriesNoise = generateTimeSeries(28, 1.30, 0.004, 0.20, 2299);
const seriesEverest = generateTimeSeries(42, 1.18, 0.002, 0.11, 460);
const seriesDabur = generateTimeSeries(45, 1.22, 0.006, 0.14, 445);
const seriesFabindia = generateTimeSeries(26, 1.08, -0.016, 0.22, 1890); // dead stock decline

export const INITIAL_SKUS: SKU[] = [
  {
    id: 'sku-boat',
    skuCode: 'BOAT-RC-450',
    name: 'boAt Rockerz 450 Pro Wireless Headphones',
    category: 'Electronics',
    description: '40mm dynamic drivers, 70hr battery playback, made-in-India wireless earphones with ASAP charge.',
    unitCost: 890,
    sellingPrice: 1799,
    currentStock: 140, // Critical stockout risk!
    inTransitStock: 0,
    locationId: 'loc-blr',
    locationName: 'Hoskote Quick-Commerce Hub',
    supplierName: 'Imagine Marketing Assembly Hub, Noida',
    supplierLeadTimeDays: 12,
    leadTimeStdDevDays: 3,
    orderSetupCost: 1200,
    holdingCostAnnualRate: 0.22,
    targetServiceLevel: 0.98,
    historicalSales: seriesBoat.history,
    forecasts: seriesBoat.forecasts,
    anomaly: {
      type: 'spike',
      severity: 'high',
      score: 96,
      title: 'Diwali Festive Rush (+145% Demand Spike)',
      description: 'Festive flash sales and social influencer reviews triggered sudden demand acceleration.',
      detectedDate: '2026-09-12',
      rootCause: 'Great Indian Festive sale pre-orders and tech influencer viral shorts campaign.',
      recommendedAction: 'Place immediate expedited PO for 450 units to prevent stockout in 2.3 days.',
    },
  },
  {
    id: 'sku-tata',
    skuCode: 'TATA-TEA-1K',
    name: 'Tata Tea Premium Gold (1kg Pack)',
    category: 'FMCG & Groceries',
    description: 'Special blend CTC black tea leaf, high-frequency household pantry essential across North & West India.',
    unitCost: 420,
    sellingPrice: 560,
    currentStock: 850,
    inTransitStock: 400,
    locationId: 'loc-bhw',
    locationName: 'Bhiwandi Central Fulfillment Hub',
    supplierName: 'Tata Consumer Products Assam Valley',
    supplierLeadTimeDays: 8,
    leadTimeStdDevDays: 2,
    orderSetupCost: 850,
    holdingCostAnnualRate: 0.18,
    targetServiceLevel: 0.98,
    historicalSales: seriesTata.history,
    forecasts: seriesTata.forecasts,
  },
  {
    id: 'sku-fortune',
    skuCode: 'FORT-OIL-5L',
    name: 'Fortune Sunlite Refined Sunflower Oil (5L Jar)',
    category: 'Kitchen & Staples',
    description: 'Light, non-sticky cooking oil enriched with Vitamins A & D, staple across 45,000 retail Kirana stores.',
    unitCost: 680,
    sellingPrice: 840,
    currentStock: 2450,
    inTransitStock: 1200,
    locationId: 'loc-del',
    locationName: 'Bilaspur Logistics Park',
    supplierName: 'Adani Wilmar Refinery, Mundra Port',
    supplierLeadTimeDays: 7,
    leadTimeStdDevDays: 2,
    orderSetupCost: 1500,
    holdingCostAnnualRate: 0.16,
    targetServiceLevel: 0.95,
    historicalSales: seriesFortune.history,
    forecasts: seriesFortune.forecasts,
  },
  {
    id: 'sku-aashirvaad',
    skuCode: 'ASH-ATTA-10K',
    name: 'Aashirvaad Shvaas 100% Whole Wheat Atta (10kg)',
    category: 'Kitchen & Staples',
    description: '0% Maida 100% MP Sharbati whole wheat grain flour, automated multi-chakkis precision milling.',
    unitCost: 380,
    sellingPrice: 475,
    currentStock: 1800,
    inTransitStock: 800,
    locationId: 'loc-maa',
    locationName: 'Sriperumbudur Mega Depot',
    supplierName: 'ITC Limited Haridwar Agri-Foods Unit',
    supplierLeadTimeDays: 6,
    leadTimeStdDevDays: 1,
    orderSetupCost: 950,
    holdingCostAnnualRate: 0.15,
    targetServiceLevel: 0.95,
    historicalSales: seriesAashirvaad.history,
    forecasts: seriesAashirvaad.forecasts,
  },
  {
    id: 'sku-noise',
    skuCode: 'NOIS-SM-PUL',
    name: 'Noise ColorFit Pulse Grand Smartwatch',
    category: 'Electronics',
    description: '1.69 inch LCD display, 60 sports modes, SpO2 & 24/7 heart rate monitor, water-resistant.',
    unitCost: 1150,
    sellingPrice: 2299,
    currentStock: 82,
    inTransitStock: 250,
    locationId: 'loc-ccu',
    locationName: 'Dankuni Industrial Hub',
    supplierName: 'Nexxbase Technologies Manesar Unit',
    supplierLeadTimeDays: 10,
    leadTimeStdDevDays: 3,
    orderSetupCost: 1100,
    holdingCostAnnualRate: 0.20,
    targetServiceLevel: 0.95,
    historicalSales: seriesNoise.history,
    forecasts: seriesNoise.forecasts,
  },
  {
    id: 'sku-everest',
    skuCode: 'EVR-MAS-500',
    name: 'Everest Royal Shahi Garam Masala (500g Commercial Pack)',
    category: 'Kitchen & Staples',
    description: 'Heritage blend of 13 aromatic Indian spices, used by commercial cloud kitchens and banquet halls.',
    unitCost: 320,
    sellingPrice: 460,
    currentStock: 620,
    inTransitStock: 300,
    locationId: 'loc-hyd',
    locationName: 'Shamshabad Cargo Depot',
    supplierName: 'Everest Spices Umbergaon Gujarat Plant',
    supplierLeadTimeDays: 9,
    leadTimeStdDevDays: 2,
    orderSetupCost: 650,
    holdingCostAnnualRate: 0.16,
    targetServiceLevel: 0.92,
    historicalSales: seriesEverest.history,
    forecasts: seriesEverest.forecasts,
  },
  {
    id: 'sku-dabur',
    skuCode: 'DAB-CHY-1KG',
    name: 'Dabur Chyawanprash Immunity Booster (1kg Jar)',
    category: 'Health & Wellness',
    description: 'Clinically tested authentic Ayurvedic formula with 40+ herbs, Amla, and natural immunity boosters.',
    unitCost: 310,
    sellingPrice: 445,
    currentStock: 410,
    inTransitStock: 600,
    locationId: 'loc-del',
    locationName: 'Bilaspur Logistics Park',
    supplierName: 'Dabur India Baddi Plant, Himachal Pradesh',
    supplierLeadTimeDays: 14,
    leadTimeStdDevDays: 4,
    orderSetupCost: 750,
    holdingCostAnnualRate: 0.19,
    targetServiceLevel: 0.98,
    historicalSales: seriesDabur.history,
    forecasts: seriesDabur.forecasts,
    anomaly: {
      type: 'lead_time_drift',
      severity: 'medium',
      score: 78,
      title: 'Monsoon NH-205 Transit Drift (+4.5 Days)',
      description: 'Mountain transit delays on Northern highway corridor extended dispatch schedules.',
      detectedDate: '2026-09-13',
      rootCause: 'Monsoon highway bottlenecks and packaging supplier delay at bottling plant.',
      recommendedAction: 'Dynamically expand safety stock buffer by +110 units to maintain 98% service level.',
    },
  },
  {
    id: 'sku-fabindia',
    skuCode: 'FAB-KRT-M',
    name: 'FabIndia Pure Cotton Handloom Kurta',
    category: 'Apparel',
    description: 'Traditional authentic hand-spun indigo weave, post-Raksha Bandhan seasonal inventory.',
    unitCost: 750,
    sellingPrice: 1890,
    currentStock: 1680, // Heavy dead stock!
    inTransitStock: 0,
    locationId: 'loc-bhw',
    locationName: 'Bhiwandi Central Fulfillment Hub',
    supplierName: 'FabIndia Overseas Sanganer Jaipur Cluster',
    supplierLeadTimeDays: 20,
    leadTimeStdDevDays: 5,
    orderSetupCost: 950,
    holdingCostAnnualRate: 0.24,
    targetServiceLevel: 0.90,
    historicalSales: seriesFabindia.history,
    forecasts: seriesFabindia.forecasts,
    anomaly: {
      type: 'dead_stock',
      severity: 'high',
      score: 92,
      title: 'Dead Stock Alert (160+ Days of Supply)',
      description: 'Post-festival demand dropped 82%; ₹12.6 Lakhs in working capital locked in Bhiwandi warehouse.',
      detectedDate: '2026-09-08',
      rootCause: 'Post-Raksha Bandhan seasonal drop and consumer preference shift.',
      recommendedAction: 'Execute 30% Diwali festive clearance bundle to liberate ₹12.6 Lakhs working capital.',
    },
  },
];

export const MODEL_BENCHMARKS: ModelPerformanceMetric[] = [
  {
    modelName: 'ensemble',
    displayName: 'Demand Drama Hybrid Ensemble (TFT + Prophet + SARIMA)',
    mae: 3.42,
    rmse: 4.88,
    mape: 5.8,
    bias: 0.12,
    trainingTimeSec: 14.2,
    recommendedFor: 'Production default for all multi-SKU retail and Indian e-commerce fulfillment.',
  },
  {
    modelName: 'lstm',
    displayName: 'Temporal Fusion Transformer (TFT) Neural Engine',
    mae: 3.85,
    rmse: 5.12,
    mape: 6.4,
    bias: -0.24,
    trainingTimeSec: 28.5,
    recommendedFor: 'Complex non-linear interactions, festive sales lifts, and monsoon variance.',
  },
  {
    modelName: 'prophet',
    displayName: 'Meta Prophet (Indian Festival & Calendar Regressors)',
    mae: 4.21,
    rmse: 5.94,
    mape: 7.6,
    bias: 0.38,
    trainingTimeSec: 3.1,
    recommendedFor: 'Strong seasonal trends, Diwali/Navratri calendar effects, and robust outlier handling.',
  },
  {
    modelName: 'sarima',
    displayName: 'Seasonal ARIMA Baseline Auto-regressive',
    mae: 5.10,
    rmse: 7.22,
    mape: 9.3,
    bias: 0.65,
    trainingTimeSec: 1.8,
    recommendedFor: 'Steady weekly Kirana replenishment patterns without promo shocks.',
  },
];

export const ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: 'alert-01',
    skuId: 'sku-boat',
    skuName: 'boAt Rockerz 450 Pro Wireless Headphones',
    skuCode: 'BOAT-RC-450',
    locationName: 'Hoskote Quick-Commerce Hub',
    type: 'spike',
    severity: 'high',
    score: 96,
    title: 'Critical Festive Demand Spike (+145% Velocity)',
    metricValue: '124 units/day (Baseline: 52)',
    threshold: '> 78 units/day (3σ alert)',
    date: '2026-09-12',
    rootCause: 'Diwali festive pre-booking & viral influencer campaign on Instagram & YouTube.',
    recommendedAction: 'Trigger urgent emergency PO for 450 units to avoid stockout in 2.3 days.',
  },
  {
    id: 'alert-02',
    skuId: 'sku-fabindia',
    skuName: 'FabIndia Pure Cotton Handloom Kurta',
    skuCode: 'FAB-KRT-M',
    locationName: 'Bhiwandi Central Fulfillment Hub',
    type: 'dead_stock',
    severity: 'high',
    score: 92,
    title: 'Severe Dead Stock: ₹12.6 Lakhs Locked Up',
    metricValue: '168 Days of Supply on Hand',
    threshold: '> 60 Days policy ceiling',
    date: '2026-09-08',
    rootCause: 'Post-Raksha Bandhan demand dropped 82%; excess inventory idling in Bhiwandi warehouse.',
    recommendedAction: 'Execute 30% festive clearance bundle to liberate ₹12.6 Lakhs working capital.',
  },
  {
    id: 'alert-03',
    skuId: 'sku-dabur',
    skuName: 'Dabur Chyawanprash Immunity Booster (1kg Jar)',
    skuCode: 'DAB-CHY-1KG',
    locationName: 'Bilaspur Logistics Park',
    type: 'lead_time_drift',
    severity: 'medium',
    score: 78,
    title: 'Monsoon NH-205 Transit Drift (+4.5 Days)',
    metricValue: 'Lead Time 14.2 days (Contract: 8.0)',
    threshold: 'Variance > 2.5 days',
    date: '2026-09-13',
    rootCause: 'Landslides on Himachal hill freight corridor causing truck dispatch hold-ups.',
    recommendedAction: 'Dynamically expand safety stock buffer by +110 units to maintain 98% service level.',
  },
];

export const INITIAL_TRANSFERS: MultiEchelonTransfer[] = [
  {
    id: 'xfer-01',
    skuId: 'sku-boat',
    skuName: 'boAt Rockerz 450 Pro Wireless Headphones',
    skuCode: 'BOAT-RC-450',
    fromLocationId: 'loc-bhw',
    fromLocationName: 'Bhiwandi Central Fulfillment Hub',
    toLocationId: 'loc-blr',
    toLocationName: 'Hoskote Quick-Commerce Hub',
    transferQuantity: 180,
    estimatedTransitDays: 2,
    reason: 'Bhiwandi has 65 days of supply; Hoskote running critical stockout risk (2.3 days left).',
    savingsVsSupplierRush: 42000,
    status: 'recommended',
  },
  {
    id: 'xfer-02',
    skuId: 'sku-tata',
    skuName: 'Tata Tea Premium Gold (1kg Pack)',
    skuCode: 'TATA-TEA-1K',
    fromLocationId: 'loc-del',
    fromLocationName: 'Bilaspur Logistics Park',
    toLocationId: 'loc-ccu',
    toLocationName: 'Dankuni Industrial Hub',
    transferQuantity: 300,
    estimatedTransitDays: 3,
    reason: 'Rebalancing inventory ahead of Durga Puja festive morning demand surge in Eastern zone.',
    savingsVsSupplierRush: 28500,
    status: 'recommended',
  },
  {
    id: 'xfer-03',
    skuId: 'sku-fortune',
    skuName: 'Fortune Sunlite Refined Sunflower Oil (5L Jar)',
    skuCode: 'FORT-OIL-5L',
    fromLocationId: 'loc-del',
    fromLocationName: 'Bilaspur Logistics Park',
    toLocationId: 'loc-hyd',
    toLocationName: 'Shamshabad Cargo Depot',
    transferQuantity: 400,
    estimatedTransitDays: 2,
    reason: 'Preventing regional depot stockout using excess buffer at Bilaspur hub via TCI Freight.',
    savingsVsSupplierRush: 34000,
    status: 'approved',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-in-9041',
    poNumber: 'PO-BHARAT-2026-9041',
    skuId: 'sku-boat',
    skuName: 'boAt Rockerz 450 Pro Wireless Headphones',
    skuCode: 'BOAT-RC-450',
    supplier: 'Imagine Marketing Assembly Hub, Noida',
    quantity: 450,
    unitCost: 890,
    totalCost: 400500,
    locationId: 'loc-blr',
    locationName: 'Hoskote Quick-Commerce Hub',
    orderDate: '2026-09-15',
    expectedArrivalDate: '2026-09-27',
    status: 'draft',
  },
  {
    id: 'po-in-9038',
    poNumber: 'PO-BHARAT-2026-9038',
    skuId: 'sku-dabur',
    skuName: 'Dabur Chyawanprash Immunity Booster (1kg Jar)',
    skuCode: 'DAB-CHY-1KG',
    supplier: 'Dabur India Baddi Plant, Himachal Pradesh',
    quantity: 600,
    unitCost: 310,
    totalCost: 186000,
    locationId: 'loc-del',
    locationName: 'Bilaspur Logistics Park',
    orderDate: '2026-09-11',
    expectedArrivalDate: '2026-09-21',
    status: 'shipped',
  },
  {
    id: 'po-in-9035',
    poNumber: 'PO-BHARAT-2026-9035',
    skuId: 'sku-aashirvaad',
    skuName: 'Aashirvaad Shvaas 100% Whole Wheat Atta (10kg)',
    skuCode: 'ASH-ATTA-10K',
    supplier: 'ITC Limited Haridwar Agri-Foods Unit',
    quantity: 800,
    unitCost: 380,
    totalCost: 304000,
    locationId: 'loc-maa',
    locationName: 'Sriperumbudur Mega Depot',
    orderDate: '2026-09-04',
    expectedArrivalDate: '2026-09-18',
    status: 'shipped',
  },
];

export const POLICY_EVALUATION_BENCHMARKS: PolicyEvaluationResult[] = [
  {
    metric: 'Forecast Error (MAPE)',
    naivePolicyValue: '21.8%',
    mlPolicyValue: '5.8%',
    improvement: '-73.4%',
    impactType: 'positive',
    explanation: 'Temporal Fusion Transformer with Indian festive calendars dramatically slashes error across Kirana and e-comm.',
  },
  {
    metric: 'Stockout Frequency',
    naivePolicyValue: '14.2% of orders',
    mlPolicyValue: '2.4% of orders',
    improvement: '-83.1%',
    impactType: 'positive',
    explanation: 'Dynamic safety stock scaling accounts for NH-48 monsoon delay and flash sales spikes.',
  },
  {
    metric: 'Annual Holding Cost (₹ Lakhs)',
    naivePolicyValue: '₹18.4 Lakhs',
    mlPolicyValue: '₹13.9 Lakhs',
    improvement: '-24.5% (₹4.5 Lakhs saved)',
    impactType: 'positive',
    explanation: 'Optimal EOQ batching prevents over-purchasing and reduces idle warehouse storage in Bhiwandi & Bilaspur.',
  },
  {
    metric: 'Fulfillment Service Level',
    naivePolicyValue: '88.6%',
    mlPolicyValue: '97.8%',
    improvement: '+9.2 pp',
    impactType: 'positive',
    explanation: 'High in-stock availability ensures customer deliveries complete in promised 24-48 hr SLAs.',
  },
  {
    metric: 'Lost Sales Avoided (Annual)',
    naivePolicyValue: '₹8.6 Lakhs',
    mlPolicyValue: '₹1.1 Lakhs',
    improvement: '+₹7.5 Lakhs revenue saved',
    impactType: 'positive',
    explanation: 'Preventing stockouts during Diwali, Navratri, and wedding season directly safeguards high-margin orders.',
  },
  {
    metric: 'Dead Stock Working Capital Locked',
    naivePolicyValue: '₹14.8 Lakhs',
    mlPolicyValue: '₹4.2 Lakhs',
    improvement: '-71.6%',
    impactType: 'positive',
    explanation: 'Early anomaly detection flags stagnating items weeks ahead of standard legacy ERPs.',
  },
];
