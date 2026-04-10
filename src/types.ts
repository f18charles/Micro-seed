import { Timestamp } from "firebase/firestore";

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
  createdAt: string | Timestamp;
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
  createdAt: string | Timestamp;
}

export interface RepaymentSchedule {
  installmentNumber: number;
  dueDate: string | Timestamp;
  amount: number;
  principal: number;
  interest: number;
  status: 'upcoming' | 'paid' | 'overdue';
  paidAt?: string | Timestamp;
}

export interface LoanApplication {
  id: string;
  userId: string;
  businessId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  appliedAt: string | Timestamp;
  assessmentId: string;
  repaymentSchedule?: RepaymentSchedule[];
  disbursedAt?: string | Timestamp;
  approvedAt?: string | Timestamp;
  rejectedAt?: string | Timestamp;
  rejectionReason?: string;
  repaidAt?: string | Timestamp;
  notes?: string; // admin notes
}

export interface Notification {
  id: string;
  userId: string;
  type: 'loan_approved' | 'loan_rejected' | 'loan_disbursed' | 'repayment_due' | 'repayment_overdue' | 'assessment_complete';
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Timestamp;
  loanId?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  totalDisbursed: number;
  totalRepaid: number;
  defaultRate: number;
}

export type Currency = 'KES' | 'USD' | 'UGX' | 'TZS' | 'NGN' | 'GHS' | 'ZAR';

export interface AppSettings {
  currency: Currency;
  currencySymbol: string;
  locale: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt?: string | Timestamp;
  lastLoginAt?: string | Timestamp;
  phone?: string;
  currency?: Currency;
}
