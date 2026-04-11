import { GoogleGenAI, Type } from "@google/genai";
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, createNotification } from '../firebase';
import { 
  FraudCheckResult, 
  SubmittedDocument, 
  BusinessProfile, 
  MonthlyFinancialRecord,
  LoanApplication
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function runFraudCheck(
  applicationId: string, 
  claimedProfile: BusinessProfile, 
  documents: SubmittedDocument[], 
  financialEvidence: MonthlyFinancialRecord[]
): Promise<FraudCheckResult> {
  const documentedRevenue = financialEvidence.reduce((sum, m) => sum + m.revenue, 0) / (financialEvidence.length || 1);
  const documentedExpenses = financialEvidence.reduce((sum, m) => sum + m.expenses, 0) / (financialEvidence.length || 1);
  const revenueDeviation = Math.abs((documentedRevenue - claimedProfile.monthlyRevenue) / claimedProfile.monthlyRevenue * 100);
  const expensesDeviation = Math.abs((documentedExpenses - claimedProfile.monthlyExpenses) / claimedProfile.monthlyExpenses * 100);

  const prompt = `
    You are a financial fraud analyst reviewing a microloan application for a business named "${claimedProfile.businessName}" in the "${claimedProfile.industry}" industry.

    Applicant claimed:
    - Monthly Revenue: ${claimedProfile.monthlyRevenue}
    - Monthly Expenses: ${claimedProfile.monthlyExpenses}

    Documented evidence (extracted from uploaded statements):
    ${JSON.stringify(financialEvidence, null, 2)}

    Check for:
    1. Duplicate dates across transactions
    2. Timeline inconsistencies
    3. Suspicious round-number patterns
    4. Revenue/expense figures that are statistically implausible
    5. Gaps in the period coverage
    6. Revenue growth rate that exceeds 300% month-on-month
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRisk: { type: Type.STRING, enum: ["clean", "low", "medium", "high", "critical"] },
            flags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  evidence: { type: Type.STRING }
                }
              }
            },
            confidenceScore: { type: Type.NUMBER },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    const aiResult = JSON.parse(response.text || '{}');

    const fraudCheckId = 'fraud_' + Date.now();
    const finalResult: FraudCheckResult = {
      id: fraudCheckId,
      applicationId,
      overallRisk: aiResult.overallRisk || 'medium',
      flags: (aiResult.flags || []).map((f: any) => ({ ...f, detectedAt: new Date().toISOString(), detectedBy: 'ai' })),
      confidenceScore: aiResult.confidenceScore || 50,
      claimedRevenue: claimedProfile.monthlyRevenue,
      documentedRevenue,
      revenueDeviation,
      claimedExpenses: claimedProfile.monthlyExpenses,
      documentedExpenses,
      expensesDeviation,
      withinAcceptableRange: revenueDeviation <= 20,
      summary: aiResult.summary || "Analysis complete.",
      checkedAt: serverTimestamp() as any,
      checkedBy: 'ai'
    };

    await setDoc(doc(db, 'fraud_checks', applicationId), finalResult);
    return finalResult;
  } catch (error) {
    console.error("Fraud check failed:", error);
    throw error;
  }
}

export async function extractFinancialData(document: SubmittedDocument): Promise<MonthlyFinancialRecord[]> {
  const prompt = `
    Analyze this financial document (URL: ${document.fileUrl}) and extract monthly financial data.
    The document is a ${document.type}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING },
              revenue: { type: Type.NUMBER },
              expenses: { type: Type.NUMBER },
              profit: { type: Type.NUMBER },
              transactionCount: { type: Type.NUMBER },
              source: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Financial extraction failed:", error);
    return [];
  }
}
