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
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'written_off';
  appliedAt: string | Timestamp;
  assessmentId: string;
  repaymentSchedule?: RepaymentSchedule[];
  disbursedAt?: string | Timestamp;
  disbursedBy?: string;         // admin uid
  approvedAt?: string | Timestamp;
  approvedBy?: string;         // admin uid
  rejectedAt?: string | Timestamp;
  rejectedBy?: string;         // admin uid
  rejectionReason?: string;
  repaidAt?: string | Timestamp;
  writtenOffAt?: string | Timestamp;
  writtenOffReason?: string;
  writtenOffBy?: string;        // admin uid
  internalNotes?: string;       // admin-only, never shown to user
  riskFlag?: 'low' | 'medium' | 'high';   // set by admin manually
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
  suspended?: boolean;
  suspendedAt?: string | Timestamp;
  suspendedReason?: string;
  totalLoans?: number;          // denormalised count
  totalDisbursed?: number;      // denormalised sum
}

export interface AuditLog {
  id: string;
  adminId: string;          // uid of admin who performed the action
  adminEmail: string;
  action: AuditAction;
  targetId: string;         // document ID affected (loanId, userId, etc.)
  targetType: 'loan' | 'user' | 'business' | 'assessment' | 'settings';
  before: Record<string, unknown> | null;   // snapshot before change
  after: Record<string, unknown> | null;    // snapshot after change
  reason?: string;          // admin's stated reason
  createdAt: string | Timestamp;
  ipAddress?: string;
}

export type AuditAction =
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_disbursed'
  | 'loan_written_off'
  | 'user_role_promoted'
  | 'user_role_demoted'
  | 'user_suspended'
  | 'user_reinstated'
  | 'user_deleted'
  | 'repayment_marked_paid'
  | 'repayment_marked_overdue'
  | 'settings_updated'
  | 'assessment_overridden';

export interface GlobalSettings {
  defaultInterestRate: number;        // e.g. 12 (percent)
  maxLoanAmount: number;              // platform ceiling
  minLoanAmount: number;
  loanTermMonths: number;             // default 12
  maintenanceMode: boolean;           // if true, show maintenance banner
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  allowNewApplications: boolean;
  platformName: string;
  supportEmail: string;
  updatedAt: string | Timestamp;
  updatedBy: string;                  // admin uid
}
