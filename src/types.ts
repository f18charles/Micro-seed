export type BusinessIndustry = 
  | 'retail' 
  | 'food_beverage' 
  | 'services' 
  | 'manufacturing' 
  | 'agriculture' 
  | 'technology' 
  | 'other';

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  industry: BusinessIndustry;
  yearsInOperation: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  location: string;
  description: string;
  goals: string;
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  businessId: string;
  score: number; // 0-100
  potentialRating: 'low' | 'medium' | 'high' | 'exceptional';
  analysis: string;
  recommendations: string[];
  loanEligibility: {
    eligible: boolean;
    maxAmount: number;
    interestRate: number;
    reasoning: string;
  };
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  userId: string;
  businessId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  appliedAt: string;
  assessmentId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
}
