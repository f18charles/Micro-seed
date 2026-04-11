import { GoogleGenAI } from "@google/genai";
import { 
  StartupProfile, 
  PersonalFinancialProfile, 
  LenderConfig, 
  StartupAssessmentResult 
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function assessStartupPotential(
  startupProfile: StartupProfile,
  personalFinancial: PersonalFinancialProfile,
  lenderConfig: LenderConfig
): Promise<StartupAssessmentResult> {
  const prompt = `
    You are a microloan credit analyst in Kenya evaluating a startup loan application.
    The applicant has NO existing business. Assess purely on plan quality, applicant capability,
    and personal financial readiness.

    BUSINESS PLAN:
    Business: ${startupProfile.businessName}
    Industry: ${startupProfile.industry}
    Location: ${startupProfile.location}
    Stage: ${startupProfile.stage}
    Description: ${startupProfile.description}
    Target Market: ${startupProfile.targetMarket}
    Unique Value Proposition: ${startupProfile.uniqueValueProposition}
    Competitor Analysis: ${startupProfile.competitorAnalysis}

    FINANCIAL PROJECTIONS:
    Projected Monthly Revenue (Month 3): ${startupProfile.projectedMonthlyRevenue}
    Revenue Justification: ${startupProfile.revenueJustification}
    Monthly Expenses: ${startupProfile.projectedMonthlyExpenses}
    Break-even Estimate: ${startupProfile.breakEvenMonths} months

    LOAN USAGE PLAN:
    Total Requested: ${startupProfile.requestedAmount}
    Usage: ${JSON.stringify(startupProfile.loanUsageBreakdown)}

    APPLICANT BACKGROUND:
    Relevant Experience: ${startupProfile.relevantExperience}
    Has Worked in Industry: ${startupProfile.hasWorkedInIndustry}
    Years Experience: ${startupProfile.yearsExperienceInIndustry}

    PERSONAL FINANCES:
    Employment Status: ${personalFinancial.employmentStatus}
    Monthly Income: ${personalFinancial.monthlyIncome}
    Monthly Obligations (rent + loans): ${personalFinancial.monthlyRent + (personalFinancial.monthlyLoanRepayments || 0)}
    Existing Loans: ${personalFinancial.hasExistingLoans}
    Previous Default: ${personalFinancial.hasDefaultedBefore}
    M-PESA Activity: ${personalFinancial.mpesaMonthlyTurnover}

    LENDER PARAMETERS:
    Max Startup Loan: ${lenderConfig.maxStartupLoanAmount}
    Min Loan: ${lenderConfig.minLoanAmount}
    Available Terms: ${lenderConfig.availableTerms}

    Assess this startup application and return a JSON StartupAssessmentResult.

    Score each dimension 0–100:
    1. planViabilityScore: Is the business plan realistic? Are projections grounded? Is the loan usage specific and sensible?
    2. marketScore: Is there clear demand? Does the applicant understand their market?
    3. applicantCapabilityScore: Does the applicant have relevant skills, experience, or training?
    4. financialReadinessScore: Can this person service a loan given their personal finances?
    5. loanUsageScore: Is the requested amount appropriate and the usage plan detailed?

    overallScore = (planViabilityScore*0.30 + marketScore*0.20 + applicantCapabilityScore*0.25 + financialReadinessScore*0.15 + loanUsageScore*0.10)

    IMPORTANT SCORING RULES:
    - Previous loan default: cap overallScore at 40
    - Vague loan usage plan (no itemisation): deduct 15 points from loanUsageScore
    - No relevant experience AND no prior business: deduct 10 from applicantCapabilityScore
    - Monthly income < monthly obligations: deduct 20 from financialReadinessScore
    - Projections with no justification: deduct 15 from planViabilityScore

    loanEligibility.eligible = overallScore >= 55
    loanEligibility.maxAmount: scale based on score and personal income
      - Score 55–64: max = MIN(requestedAmount, lenderConfig.maxStartupLoanAmount * 0.4)
      - Score 65–74: max = MIN(requestedAmount, lenderConfig.maxStartupLoanAmount * 0.6)
      - Score 75–84: max = MIN(requestedAmount, lenderConfig.maxStartupLoanAmount * 0.8)
      - Score >= 85: max = MIN(requestedAmount, lenderConfig.maxStartupLoanAmount)

    recommendsMilestoneDisbursement: true if overallScore < 70 OR requestedAmount > 50000

    If recommendsMilestoneDisbursement is true, generate 2–3 milestones with specific
    trigger conditions and required evidence documents.

    Return the response in this exact JSON format:
    {
      "planViabilityScore": number,
      "marketScore": number,
      "applicantCapabilityScore": number,
      "financialReadinessScore": number,
      "loanUsageScore": number,
      "overallScore": number,
      "planRating": "weak" | "fair" | "solid" | "strong",
      "overallRating": "low" | "medium" | "high" | "exceptional",
      "planStrengths": string[],
      "planWeaknesses": string[],
      "riskFactors": string[],
      "recommendations": string[],
      "marketAnalysis": string,
      "viabilityAnalysis": string,
      "loanEligibility": {
        "eligible": boolean,
        "maxAmount": number,
        "interestRate": number,
        "termMonths": number,
        "reasoning": string,
        "conditions": string[]
      },
      "recommendsMilestoneDisbursement": boolean,
      "milestones": [
        {
          "milestoneNumber": number,
          "description": string,
          "amount": number,
          "triggerCondition": string,
          "requiredEvidence": string[],
          "dueWithinDays": number,
          "status": "pending"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const parsed = JSON.parse(response.text);
    return {
      ...parsed,
      id: 'st_asmt_' + Date.now(),
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Startup assessment AI error:", error);
    // Fallback basic assessment
    return {
      id: 'st_asmt_' + Date.now(),
      userId: startupProfile.userId,
      startupProfileId: startupProfile.id,
      applicationId: '',
      planViabilityScore: 50,
      marketScore: 50,
      applicantCapabilityScore: 50,
      financialReadinessScore: 50,
      loanUsageScore: 50,
      overallScore: 50,
      planRating: 'fair',
      overallRating: 'medium',
      planStrengths: ["Idea submitted"],
      planWeaknesses: ["AI analysis failed"],
      riskFactors: ["Unverified plan"],
      recommendations: ["Please contact support for manual review"],
      marketAnalysis: "Analysis pending",
      viabilityAnalysis: "Analysis pending",
      loanEligibility: {
        eligible: false,
        maxAmount: 0,
        interestRate: 15,
        termMonths: 6,
        reasoning: "AI analysis encountered an error.",
        conditions: []
      },
      recommendsMilestoneDisbursement: false,
      createdAt: new Date().toISOString()
    };
  }
}
