import { Timestamp } from "firebase/firestore";

export type BusinessIndustry = 
  | 'retail' 
  | 'food_beverage' 
  | 'services' 
  | 'manufacturing' 
  | 'agriculture' 
  | 'technology' 
  | 'other';

export type ApplicationTrack = 'existing' | 'startup';

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
  applicationTrack: ApplicationTrack;
  // For startup track only
  startupStage?: StartupStage;
  projectedMonthlyRevenue?: number;
  projectedMonthlyExpenses?: number;
  targetMarket?: string;
  uniqueValueProposition?: string;
  fundingUsagePlan?: string;
  createdAt: string | Timestamp;
}

export interface AssessmentResult {
  id: string;
  userId: string;
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
  applicationTrack: ApplicationTrack;
  startupProfileId?: string;
  startupAssessmentId?: string;
  disbursementMilestones?: DisbursementMilestone[];
  disbursementType?: 'lumpsum' | 'milestonebased';
  graduationEligible?: boolean;
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
  | 'personalbankstatement'
  | 'personalmpesastatement'
  | 'payslip'
  | 'employment_letter'
  | 'businessplandocument'
  | 'supplier_quote'
  | 'premises_photo'
  | 'training_certificate'
  | 'sacco_statement'
  | 'milestone_evidence'     // photos/receipts proving a milestone was completed
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
  
  // Startup Loans
  startupLoansEnabled: boolean;
  maxStartupLoanAmount: number;
  startupLoanTerms: number[];
  startupMinGuarantors: number;
  startupDefaultInterestRate: number;
  startupRequiredDocumentTypes: DocumentType[];
  allowMilestoneDisbursement: boolean;
  requireMilestoneDisbursement: boolean;
  milestoneMaxCount: number;
  enableGraduation: boolean;
  graduationMinRepaymentScore: number;
  graduationMultiplierTiers: {
    minRepaymentScore: number;
    multiplier: number;
  }[];

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
  type: 'loan_approved' | 'loan_rejected' | 'loan_disbursed' | 'repayment_due' | 'repayment_overdue' | 'assessment_complete' | 'milestone_verified' | 'milestone_rejected' | 'graduation_eligible';
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Timestamp;
  loanId?: string;
}

export type StartupStage =
  | 'idea'              // just an idea, nothing built yet
  | 'planning'          // researching, writing business plan
  | 'pre_launch'        // ready to launch, needs capital to start
  | 'launchednorevenue'; // trading but not yet generating revenue

export interface StartupProfile {
  id: string;
  userId: string;
  businessProfileId: string;   // linked to BusinessProfile
  loanApplicationId?: string;
  stage: StartupStage;

  // The idea
  businessName: string;
  industry: BusinessIndustry;
  location: string;
  description: string;           // what the business will do
  targetMarket: string;          // who the customers are
  uniqueValueProposition: string; // why customers will choose this business
  competitorAnalysis: string;    // who else does this, and why this is better

  // The plan
  fundingUsagePlan: string;      // line-by-line: "30,000 for stock, 10,000 for rent deposit"
  projectedMonthlyRevenue: number;  // month 3 projection (after ramp-up)
  projectedMonthlyExpenses: number;
  revenueJustification: string;  // how did you arrive at this projection?
  breakEvenMonths: number;       // estimated months to break even
  
  // Applicant background
  relevantExperience: string;    // prior work/skills relevant to the business
  hasWorkedInIndustry: boolean;
  yearsExperienceInIndustry?: number;

  // Loan usage
  requestedAmount: number;
  loanUsageBreakdown: LoanUsageItem[]; // itemised usage plan

  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface LoanUsageItem {
  item: string;           // e.g. "Initial stock purchase"
  cost: number;         // e.g. 45000
  category: 'stock' | 'equipment' | 'premises' | 'marketing' | 'working_capital' | 'other';
  isEssential: boolean;   // must have vs nice to have
}

export interface PersonalFinancialProfile {
  id: string;
  userId: string;
  applicationId: string;

  // Income
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'student' | 'other';
  monthlyIncome: number;         // current personal income
  incomeSource: string;          // employer name or income description
  hasOtherIncome: boolean;
  otherIncomeAmount?: number;
  otherIncomeSource?: string;

  // Obligations
  monthlyRent: number;
  monthlyLoanRepayments: number; // existing personal loan payments
  monthlySavings: number;
  otherMonthlyExpenses: number;

  // Savings & assets
  hasSavings: boolean;
  estimatedSavings?: number;     // rough estimate, not verified
  hasProperty: boolean;          // owns land or property (not collateral, just profile info)
  hasMobileMoneyHistory: boolean; // active M-PESA user
  mpesaMonthlyTurnover?: number; // average monthly M-PESA transactions

  // Credit history
  hasExistingLoans: boolean;
  existingLoanDetails?: string;
  hasDefaultedBefore: boolean;
  defaultDetails?: string;

  createdAt: string | Timestamp;
}

export interface StartupAssessmentResult {
  id: string;
  userId: string;
  startupProfileId: string;
  applicationId: string;

  // Scores (each 0–100)
  planViabilityScore: number;    // Is the business plan realistic and coherent?
  marketScore: number;           // Is there a clear market and demand?
  applicantCapabilityScore: number; // Does the applicant have relevant skills/experience?
  financialReadinessScore: number;  // Personal finances support repayment capacity?
  loanUsageScore: number;        // Is the loan usage plan specific and sensible?
  overallScore: number;          // Weighted average

  // Ratings
  planRating: 'weak' | 'fair' | 'solid' | 'strong';
  overallRating: 'low' | 'medium' | 'high' | 'exceptional';

  // AI analysis
  planStrengths: string[];
  planWeaknesses: string[];
  riskFactors: string[];
  recommendations: string[];
  marketAnalysis: string;
  viabilityAnalysis: string;

  // Loan eligibility
  loanEligibility: {
    eligible: boolean;
    maxAmount: number;
    interestRate: number;
    termMonths: number;
    reasoning: string;
    conditions: string[];        // e.g. "Requires 2 verified guarantors", "Must submit receipt within 30 days of each purchase"
  };

  // Milestone-based disbursement recommendation
  recommendsMilestoneDisbursement: boolean;
  milestones?: DisbursementMilestone[];

  createdAt: string | Timestamp;
}

export interface DisbursementMilestone {
  milestoneNumber: number;
  description: string;           // e.g. "Premises secured and stock purchased"
  amount: number;      // portion of total loan
  triggerCondition: string;      // what the borrower must prove
  requiredEvidence: DocumentType[]; // which docs prove completion
  dueWithinDays: number;         // deadline from loan approval
  status: 'pending' | 'evidence_submitted' | 'verified' | 'disbursed' | 'missed';
  evidenceDocumentIds?: string[];
  verifiedAt?: string | Timestamp;
  verifiedBy?: string;           // admin uid
  disbursedAt?: string | Timestamp;
}

export interface GraduationRecord {
  id: string;
  userId: string;
  originalLoanId: string;
  businessProfileId: string;
  repaymentsOnTime: number;      // count of on-time payments
  repaymentsTotal: number;
  repaymentScore: number;        // 0–100 based on payment behaviour
  businessNowOperating: boolean;
  revenueVerified: boolean;
  eligibleForGraduation: boolean;
  graduationLoanMaxAmount: number;
  assessedAt: string | Timestamp;
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
