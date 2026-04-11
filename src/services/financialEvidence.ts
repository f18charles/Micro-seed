import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FinancialEvidenceSummary, 
  SubmittedDocument, 
  MonthlyFinancialRecord 
} from '../types';
import { extractFinancialData } from './fraudDetection';

export async function buildFinancialEvidenceSummary(
  applicationId: string, 
  businessId: string, 
  documents: SubmittedDocument[]
): Promise<FinancialEvidenceSummary> {
  const allMonths: MonthlyFinancialRecord[] = [];

  // Extract data from each financial document
  for (const docData of documents) {
    if (['bank_statement', 'mpesa_statement', 'sales_records', 'financial_statement'].includes(docData.type)) {
      const extracted = await extractFinancialData(docData);
      allMonths.push(...extracted.map(m => ({ ...m, documentId: docData.id, verified: true })));
    }
  }

  // Aggregate by month (if multiple sources for same month, average them or prioritize)
  const monthlyMap = new Map<string, MonthlyFinancialRecord[]>();
  allMonths.forEach(m => {
    const existing = monthlyMap.get(m.month) || [];
    existing.push(m);
    monthlyMap.set(m.month, existing);
  });

  const aggregatedMonths: MonthlyFinancialRecord[] = Array.from(monthlyMap.entries()).map(([month, records]) => {
    const avgRevenue = records.reduce((sum, r) => sum + r.revenue, 0) / records.length;
    const avgExpenses = records.reduce((sum, r) => sum + r.expenses, 0) / records.length;
    return {
      month,
      revenue: avgRevenue,
      expenses: avgExpenses,
      profit: avgRevenue - avgExpenses,
      transactionCount: records.reduce((sum, r) => sum + (r.transactionCount || 0), 0),
      source: records[0].source, // Simple pick
      verified: true
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  const avgMonthlyRevenue = aggregatedMonths.reduce((sum, m) => sum + m.revenue, 0) / (aggregatedMonths.length || 1);
  const avgMonthlyExpenses = aggregatedMonths.reduce((sum, m) => sum + m.expenses, 0) / (aggregatedMonths.length || 1);
  const avgMonthlyProfit = avgMonthlyRevenue - avgMonthlyExpenses;

  const trend = computeTrend(aggregatedMonths);

  const summary: FinancialEvidenceSummary = {
    id: 'evid_' + Date.now(),
    businessId,
    applicationId,
    months: aggregatedMonths,
    averageMonthlyRevenue: avgMonthlyRevenue,
    averageMonthlyExpenses: avgMonthlyExpenses,
    averageMonthlyProfit: avgMonthlyProfit,
    periodCoveredMonths: aggregatedMonths.length,
    trend: trend.trend,
    trendPercentage: trend.trendPercentage,
    claimedRevenueDeviation: 0, // Will be set by fraud check
    deviationDirection: 'under',
    withinThreshold: true,
    createdAt: serverTimestamp() as any
  };

  await setDoc(doc(db, 'financial_evidence', applicationId), summary);
  return summary;
}

function computeTrend(months: MonthlyFinancialRecord[]): { trend: 'growing' | 'stable' | 'declining' | 'volatile', trendPercentage: number } {
  if (months.length < 2) return { trend: 'stable', trendPercentage: 0 };

  const growthRates: number[] = [];
  for (let i = 1; i < months.length; i++) {
    const prev = months[i-1].revenue;
    const curr = months[i].revenue;
    if (prev > 0) {
      growthRates.push((curr - prev) / prev * 100);
    }
  }

  const avgGrowth = growthRates.reduce((sum, r) => sum + r, 0) / (growthRates.length || 1);
  
  // Calculate standard deviation for volatility
  const mean = avgGrowth;
  const squareDiffs = growthRates.map(r => Math.pow(r - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, d) => sum + d, 0) / (squareDiffs.length || 1);
  const stdDev = Math.sqrt(avgSquareDiff);

  let trend: 'growing' | 'stable' | 'declining' | 'volatile' = 'stable';
  if (stdDev > 30) trend = 'volatile';
  else if (avgGrowth > 5) trend = 'growing';
  else if (avgGrowth < -5) trend = 'declining';

  return { trend, trendPercentage: avgGrowth };
}
