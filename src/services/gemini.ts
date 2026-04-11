import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile, AssessmentResult } from "../types";
import { sanitiseText } from "../lib/sanitise";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function assessBusinessPotential(profile: BusinessProfile): Promise<Omit<AssessmentResult, 'id' | 'businessId' | 'createdAt'>> {
  const prompt = `
    Analyze this small business profile and assess its growth potential for a microloan.
    Business: ${sanitiseText(profile.businessName)}
    Industry: ${profile.industry}
    Location: ${sanitiseText(profile.location)}
    Years: ${profile.yearsInOperation}
    Revenue: ${profile.monthlyRevenue}
    Expenses: ${profile.monthlyExpenses}
    Description: ${sanitiseText(profile.description)}
    Goals: ${sanitiseText(profile.goals)}

    Provide a JSON response with:
    - score (0-100)
    - potentialRating (low, moderate, high, exceptional)
    - analysis (2-3 sentences)
    - recommendations (list of 3 actionable items)
    - loanEligibility (object with eligible: boolean, maxAmount: number, interestRate: number, reasoning: string)
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
            score: { type: Type.NUMBER },
            potentialRating: { type: Type.STRING },
            analysis: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            loanEligibility: {
              type: Type.OBJECT,
              properties: {
                eligible: { type: Type.BOOLEAN },
                maxAmount: { type: Type.NUMBER },
                interestRate: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              },
              required: ["eligible", "maxAmount", "interestRate", "reasoning"]
            }
          },
          required: ["score", "potentialRating", "analysis", "recommendations", "loanEligibility"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Assessment Error:", error);
    throw error;
  }
}

export async function generateGrowthPlan(profile: BusinessProfile, assessment: AssessmentResult) {
  const prompt = `
    Create a 90-day growth roadmap for this business.
    Business: ${profile.businessName}
    Current Score: ${assessment.score}
    Analysis: ${assessment.analysis}
    
    Provide a JSON response with 3 phases (week1to4, week5to8, week9to12), each having a 'focus' and 3 'actions'.
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
            week1to4: {
              type: Type.OBJECT,
              properties: {
                focus: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["focus", "actions"]
            },
            week5to8: {
              type: Type.OBJECT,
              properties: {
                focus: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["focus", "actions"]
            },
            week9to12: {
              type: Type.OBJECT,
              properties: {
                focus: { type: Type.STRING },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["focus", "actions"]
            }
          },
          required: ["week1to4", "week5to8", "week9to12"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Growth Plan Error:", error);
    throw error;
  }
}
