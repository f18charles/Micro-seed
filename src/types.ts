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
  financialEvidenceId?: string;
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
  termMonths?: number;           // chosen by admin at approval, from availableTerms
  interestRate?: number;         // set by admin, within lender config range
  interestRateModel?: 'flat' | 'reducing_balance';
  guarantorIds?: string[];       // array of Guarantor document IDs
  documentIds?: string[];        // array of SubmittedDocument IDs
  fraudCheckId?: string;         // links to FraudCheckResult
  financialEvidenceId?: string;  // links to FinancialEvidenceSummary
  appealId?: string;             // links to LoanAppeal if applicable
  disbursementReference?: string; // M-PESA or bank transaction ref
  repaymentPhoneNumber?: string;  // M-PESA number for repayments
}

export type DocumentType =
  | 'kra_pin'                  // KRA PIN certificate
  | 'national_id'              // Kenya National ID (front)
  | 'nationalidback'         // Kenya National ID (back)
  | 'passport'                 // Passport bio page
  | 'bank_statement'           // 3–6 month bank statement PDF
  | 'mpesa_statement'          // M-PESA statement PDF
  | 'business_permit'          // County business permit
  | 'cr12'                     // Companies Registry CR12 (for registered companies)
  | 'tax_compliance'           // KRA Tax Compliance Certificate
  | 'financial_statement'      // Accountant-prepared P&L or balance sheet
  | 'sales_records'            // Sales/invoice records (CSV, PDF, or image)
  | 'procurement_records'      // Purchase/expense records
  | 'business_plan'            // For appeal applicants
  | 'guarantor_id'             // Guarantor's national ID
  | 'guarantor_kra'            // Guarantor's KRA PIN
  | 'guarantor_consent'        // Signed guarantor consent form
  | 'other';

export type DocumentStatus =
  | 'pending_review'           // Uploaded, not yet reviewed
  | 'verified'                 // Admin confirmed as genuine
  | 'rejected'                 // Admin rejected (reason required)
  | 'flagged';                 // Fraud flag raised

export interface SubmittedDocument {
  id: string;
  userId: string;
  businessId?: string;
  loanApplicationId?: string;
  guarantorId?: string;         // if this doc belongs to a guarantor
  type: DocumentType;
  fileName: string;
  fileUrl: string;              // Firebase Storage download URL
  filePath: string;             // Firebase Storage path for deletion
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string | Timestamp;
  status: DocumentStatus;
  reviewedBy?: string;          // admin uid
  reviewedAt?: string | Timestamp;
  rejectionReason?: string;
  fraudFlags?: FraudFlag[];     // populated by AI fraud check
  periodCovered?: {             // for financial documents
    from: string;               // ISO date e.g. "2025-10-01"
    to: string;                 // ISO date e.g. "2026-03-31"
  };
  extractedData?: Record<string, unknown>; // structured data extracted by AI
}

export type FraudFlagType =
  | 'duplicate_dates'           // Multiple transactions share same date/time
  | 'timeline_inconsistency'    // Events are in impossible chronological order
  | 'roundnumberpattern'      // Suspicious frequency of exact round numbers
  | 'missing_period'            // Gap in expected date coverage
  | 'revenueexpensemismatch'  // Large deviation from claimed figures
  | 'document_tampering'        // Metadata or formatting anomalies
  | 'identity_mismatch'         // Name/ID on doc doesn't match profile
  | 'implausible_growth'        // Revenue growth rate is statistically implausible
  | 'overlapping_claims'        // Two docs cover same period with different numbers
  | 'low_confidence';           // AI confidence in document is below threshold

export interface FraudFlag {
  type: FraudFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;          // human-readable explanation
  evidence?: string;            // specific data point that triggered this
  detectedAt: string | Timestamp;
  detectedBy: 'ai' | 'admin';
}

export interface FraudCheckResult {
  id: string;
  applicationId: string;
  overallRisk: 'clean' | 'low' | 'medium' | 'high' | 'critical';
  flags: FraudFlag[];
  confidenceScore: number;      // 0–100, AI confidence in assessment
  claimedRevenue: number;       // from business profile
  documentedRevenue: number;    // extracted from uploaded documents
  revenueDeviation: number;     // percentage difference
  claimedExpenses: number;
  documentedExpenses: number;
  expensesDeviation: number;
  withinAcceptableRange: boolean; // true if deviation <= 20%
  summary: string;              // AI narrative summary
  checkedAt: string | Timestamp;
  checkedBy: 'ai' | 'admin';
  overrideBy?: string;          // admin uid if manually overridden
  overrideReason?: string;
}

export type GuarantorStatus =
  | 'invited'                   // Email/SMS sent, not yet responded
  | 'accepted'                  // Guarantor confirmed consent
  | 'declined'                  // Guarantor refused
  | 'documents_pending'         // Accepted but hasn't uploaded docs yet
  | 'documents_submitted'       // Docs uploaded, awaiting admin review
  | 'verified'                  // Admin confirmed guarantor is valid
  | 'invalidated';              // Removed or disqualified

export interface Guarantor {
  id: string;
  loanApplicationId: string;
  applicantUserId: string;       // the borrower's uid
  fullName: string;
  nationalIdNumber: string;      // masked in UI: "*4521"
  kraPinNumber: string;          // masked in UI: "A*789K"
  phone: string;
  email: string;
  relationship: string;          // e.g. "Business partner", "Family member"
  status: GuarantorStatus;
  invitedAt: string | Timestamp;
  respondedAt?: string | Timestamp;
  verifiedAt?: string | Timestamp;
  verifiedBy?: string;           // admin uid
  documents: string[];           // array of SubmittedDocument IDs
  consentText: string;           // exact text they agreed to
  consentAcceptedAt?: string | Timestamp;
  ipAddress?: string;            // captured at consent time
}

export interface MonthlyFinancialRecord {
  month: string;                 // "YYYY-MM" e.g. "2025-11"
  revenue: number;               // extracted or manually entered
  expenses: number;
  profit: number;                // derived: revenue - expenses
  transactionCount?: number;     // from bank/M-PESA statements
  source: 'bankstatement' | 'mpesastatement' | 'salesrecords' | 'selfreported';
  documentId?: string;           // links to SubmittedDocument
  verified: boolean;
}

export interface FinancialEvidenceSummary {
  id: string;
  businessId: string;
  applicationId: string;
  months: MonthlyFinancialRecord[];
  averageMonthlyRevenue: number;
  averageMonthlyExpenses: number;
  averageMonthlyProfit: number;
  periodCoveredMonths: number;   // how many months of data submitted
  trend: 'growing' | 'stable' | 'declining' | 'volatile';
  trendPercentage: number;       // e.g. +12 means 12% avg monthly growth
  claimedRevenueDeviation: number;  // % diff between claimed and documented
  deviationDirection: 'over' | 'under'; // did they over-claim or under-claim?
  withinThreshold: boolean;      // deviation <= 20%
  createdAt: string | Timestamp;
}

export interface LenderConfig {
  id: 'lender_config';           // singleton document
  lenderName: string;
  lenderLogoUrl?: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  availableTerms: number[];      // e.g. [3, 6, 9, 12, 18, 24] months
  defaultTermMonths: number;
  interestRateModel: 'flat' | 'reducing_balance';
  minInterestRate: number;       // e.g. 5 (percent)
  maxInterestRate: number;       // e.g. 30
  defaultInterestRate: number;
  requireGuarantors: boolean;
  minGuarantors: number;         // e.g. 1
  maxGuarantors: number;         // e.g. 3
  requireFinancialDocs: boolean;
  minDocumentMonths: number;     // minimum months of statements required (e.g. 3)
  acceptableRevenueDeviation: number;  // e.g. 20 (percent)
  requiredDocumentTypes: DocumentType[];  // which doc types are mandatory
  fraudAutoReject: boolean;      // auto-reject if fraud risk is 'high' or 'critical'
  allowAppeals: boolean;
  appealWindowDays: number;      // how many days after rejection to appeal
  disbursementMethod: 'mpesa' | 'bank_transfer' | 'manual';
  repaymentMethods: ('mpesa' | 'bank_transfer' | 'cash')[];
  updatedAt: string | Timestamp;
  updatedBy: string;             // admin uid
}

export type AppealStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'                  // appeal succeeded, loan re-opened
  | 'rejected';                 // appeal failed, final decision

export interface LoanAppeal {
  id: string;
  originalLoanId: string;
  applicantUserId: string;
  businessId: string;
  status: AppealStatus;
  appealReason: string;          // applicant's written explanation
  businessPlanDocumentId?: string; // SubmittedDocument ID for business plan
  guarantorIds: string[];        // must have at least minGuarantors verified
  submittedAt: string | Timestamp;
  reviewedAt?: string | Timestamp;
  reviewedBy?: string;           // admin uid
  adminDecision?: string;        // admin's written decision
  newLoanId?: string;            // if appeal approved, the new loan created
}

export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash';
export type PaymentDirection = 'disbursement' | 'repayment';
export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed';

export interface PaymentTransaction {
  id: string;
  loanId: string;
  userId: string;
  direction: PaymentDirection;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  referenceNumber?: string;       // M-PESA confirmation code or bank ref
  phoneNumber?: string;           // for M-PESA
  accountNumber?: string;         // for bank transfer
  bankName?: string;
  initiatedAt: string | Timestamp;
  completedAt?: string | Timestamp;
  failureReason?: string;
  installmentNumber?: number;     // which repayment instalment this covers
  confirmedBy?: string;           // admin uid (for manual confirmation)
  receiptUrl?: string;            // Firebase Storage URL of uploaded receipt
}

export type KycStatus = 'notstarted' | 'inprogress' | 'submitted' | 'verified' | 'rejected';

export interface KycRecord {
  id: string;
  userId: string;
  status: KycStatus;
  nationalIdNumber?: string;      // stored encrypted — display masked only
  kraPinNumber?: string;          // stored encrypted — display masked only
  fullLegalName?: string;
  dateOfBirth?: string;
  physicalAddress?: string;
  documentIds: string[];          // national ID, KRA PIN, passport docs
  submittedAt?: string | Timestamp;
  verifiedAt?: string | Timestamp;
  verifiedBy?: string;            // admin uid
  rejectionReason?: string;
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
  kycStatus?: KycStatus;
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
