import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function assessBusinessPotential(profile: BusinessProfile) {
  const prompt = `
    Assess the business potential for the following small business:
    Business Name: ${profile.businessName}
    Industry: ${profile.industry}
    Years in Operation: ${profile.yearsInOperation}
    Monthly Revenue: $${profile.monthlyRevenue}
    Monthly Expenses: $${profile.monthlyExpenses}
    Location: ${profile.location}
    Description: ${profile.description}
    Goals: ${profile.goals}

    Provide a detailed assessment including:
    1. A potential score from 0 to 100.
    2. A rating (low, medium, high, exceptional).
    3. A detailed analysis of their strengths and weaknesses.
    4. 3-5 specific recommendations for growth.
    5. Loan eligibility assessment (max amount, interest rate, and reasoning).
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Assessment Error:", error);
    throw error;
  }
}
