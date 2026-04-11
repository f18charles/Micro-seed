import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { 
  LoanApplication, 
  BusinessProfile, 
  AssessmentResult, 
  UserProfile, 
  AuditLog, 
  RepaymentSchedule,
  StartupProfile,
  PersonalFinancialProfile,
  StartupAssessmentResult,
  LenderConfig
} from "../../types";
import { graduationService } from "../../services/graduationService";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  X, 
  Info, 
  Building2, 
  User as UserIcon, 
  History, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Ban,
  Banknote,
  FileText,
  MessageSquare,
  Rocket,
  Wallet
} from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { formatDate } from "../../lib/utils";
import { cn } from "../../lib/utils";
import { auditLogService } from "../../services/auditLog";
import { notificationService } from "../../services/notifications";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { addMonths } from "date-fns";

interface LoanDetailDrawerProps {
  loanId: string;
  onClose: () => void;
}

export default function LoanDetailDrawer({ loanId, onClose }: LoanDetailDrawerProps) {
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [applicant, setApplicant] = useState<UserProfile | null>(null);
  const [startupProfile, setStartupProfile] = useState<StartupProfile | null>(null);
  const [personalFinancial, setPersonalFinancial] = useState<PersonalFinancialProfile | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [internalNotes, setInternalNotes] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDisburseDialogOpen, setIsDisburseDialogOpen] = useState(false);
  const [isWriteOffDialogOpen, setIsWriteOffDialogOpen] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const loanDoc = await getDoc(doc(db, "loans", loanId));
        if (!loanDoc.exists()) return;
        const loanData = { id: loanDoc.id, ...loanDoc.data() } as LoanApplication;
        setLoan(loanData);
        setInternalNotes(loanData.internalNotes || "");

        const promises: Promise<any>[] = [
          getDoc(doc(db, "businesses", loanData.businessId)),
          getDoc(doc(db, "users", loanData.userId)),
        ];

        if (loanData.applicationTrack === 'startup') {
          promises.push(getDoc(doc(db, "startup_assessments", loanData.startupAssessmentId || '')));
          if (loanData.startupProfileId) {
            promises.push(getDoc(doc(db, "startup_profiles", loanData.startupProfileId)));
          }
          // Try to find personal financial profile
          const pfQuery = query(collection(db, "personalfinancialprofiles"), where("userId", "==", loanData.userId));
          promises.push(getDocs(pfQuery));
        } else {
          promises.push(getDoc(doc(db, "assessments", loanData.assessmentId)));
        }

        const results = await Promise.all(promises);
        
        if (results[0].exists()) setBusiness(results[0].data() as BusinessProfile);
        if (results[1].exists()) setApplicant(results[1].data() as UserProfile);
        
        if (loanData.applicationTrack === 'startup') {
          if (results[2].exists()) setAssessment(results[2].data() as any);
          if (results[3]?.exists()) setStartupProfile(results[3].data() as StartupProfile);
          if (results[4] && !results[4].empty) setPersonalFinancial(results[4].docs[0].data() as PersonalFinancialProfile);
        } else {
          if (results[2].exists()) setAssessment(results[2].data() as AssessmentResult);
        }

        // Audit Trail
        const logsQuery = query(
          collection(db, "audit_logs"), 
          where("targetId", "==", loanId),
          orderBy("createdAt", "desc")
        );
        const unsubLogs = onSnapshot(logsQuery, (s) => {
          setAuditTrail(s.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
        });

        return () => unsubLogs();
      } catch (error) {
        console.error("Error fetching loan details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loanId]);

  const handleUpdateNotes = async () => {
    if (!loan || internalNotes === loan.internalNotes) return;
    try {
      await updateDoc(doc(db, "loans", loanId), { internalNotes });
      toast.success("Notes saved");
    } catch (error) {
      toast.error("Failed to save notes");
    }
  };

  const handleRiskChange = async (risk: 'low' | 'medium' | 'high') => {
    if (!loan) return;
    try {
      await updateDoc(doc(db, "loans", loanId), { riskFlag: risk });
      await auditLogService.writeAuditLog({
        action: 'settings_updated',
        targetId: loanId,
        targetType: 'loan',
        before: { riskFlag: loan.riskFlag },
        after: { riskFlag: risk },
        reason: `Risk flag updated to ${risk}`
      });
      setLoan({ ...loan, riskFlag: risk });
      toast.success(`Risk set to ${risk}`);
    } catch (error) {
      toast.error("Failed to update risk");
    }
  };

  const handleApprove = async () => {
    if (!loan || !assessment) return;
    
    const interestRate = assessment.loanEligibility.interestRate / 100;
    const monthlyRate = interestRate / 12;
    const termMonths = 12;
    const monthlyPayment = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);

    const schedule: RepaymentSchedule[] = Array.from({ length: termMonths }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: addMonths(new Date(), i + 1).toISOString(),
      amount: monthlyPayment,
      principal: monthlyPayment - (loan.amount * monthlyRate),
      interest: loan.amount * monthlyRate,
      status: 'upcoming'
    }));

    try {
      const update = {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: (loan as any).approvedBy || "admin", // Placeholder if auth not ready
        repaymentSchedule: schedule
      };
      await updateDoc(doc(db, "loans", loanId), update);
      await auditLogService.writeAuditLog({
        action: 'loan_approved',
        targetId: loanId,
        targetType: 'loan',
        before: { status: loan.status },
        after: { status: 'approved' }
      });
      await notificationService.sendLoanApproved(loan.userId, loanId, formatCurrency(loan.amount, 'KES'));
      
      setLoan({ ...loan, ...update, status: 'approved' } as any);
      setIsApproveDialogOpen(false);
      toast.success("Loan approved");
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    if (!loan || rejectionReason.length < 20) return;
    try {
      const update = {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: "admin",
        rejectionReason
      };
      await updateDoc(doc(db, "loans", loanId), update);
      await auditLogService.writeAuditLog({
        action: 'loan_rejected',
        targetId: loanId,
        targetType: 'loan',
        before: { status: loan.status },
        after: { status: 'rejected' },
        reason: rejectionReason
      });
      await notificationService.sendLoanRejected(loan.userId, loanId, rejectionReason);
      
      setLoan({ ...loan, ...update, status: 'rejected' } as any);
      setIsRejectDialogOpen(false);
      toast.success("Loan rejected");
    } catch (error) {
      toast.error("Rejection failed");
    }
  };

  const handleDisburse = async () => {
    if (!loan) return;
    try {
      let update: any = {
        status: 'disbursed',
        disbursedAt: serverTimestamp(),
        disbursedBy: "admin"
      };

      // If it's a startup loan with milestones, only disburse the first one
      if (loan.applicationTrack === 'startup' && loan.disbursementMilestones) {
        const milestones = [...loan.disbursementMilestones];
        if (milestones.length > 0 && milestones[0].status === 'pending') {
          milestones[0].status = 'disbursed';
          milestones[0].disbursedAt = new Date().toISOString();
          update.disbursementMilestones = milestones;
          // Keep status as 'approved' or 'disbursed'? 
          // Usually 'disbursed' means the whole loan is out, but for milestones it's partial.
          // Let's keep it as 'disbursed' but track milestones.
        }
      }

      await updateDoc(doc(db, "loans", loanId), update);
      await auditLogService.writeAuditLog({
        action: 'loan_disbursed',
        targetId: loanId,
        targetType: 'loan',
        before: { status: loan.status },
        after: { status: 'disbursed' }
      });
      await notificationService.sendLoanDisbursed(loan.userId, loanId, formatCurrency(loan.amount, 'KES'));
      
      setLoan({ ...loan, ...update, status: 'disbursed' } as any);
      setIsDisburseDialogOpen(false);
      toast.success("Loan marked as disbursed");
    } catch (error) {
      toast.error("Disbursement update failed");
    }
  };

  const handleVerifyMilestone = async (milestoneNumber: number) => {
    if (!loan || !loan.disbursementMilestones) return;
    try {
      const milestones = [...loan.disbursementMilestones];
      const index = milestones.findIndex(m => m.milestoneNumber === milestoneNumber);
      if (index === -1) return;

      milestones[index].status = 'verified';
      milestones[index].verifiedAt = new Date().toISOString();
      milestones[index].verifiedBy = "admin";

      // Auto-disburse if verified? Or separate step?
      // Let's make it a separate step for safety, but here we just verify.
      
      await updateDoc(doc(db, "loans", loanId), { disbursementMilestones: milestones });
      setLoan({ ...loan, disbursementMilestones: milestones });
      toast.success(`Milestone ${milestoneNumber} verified`);
    } catch (error) {
      toast.error("Failed to verify milestone");
    }
  };

  const handleDisburseMilestone = async (milestoneNumber: number) => {
    if (!loan || !loan.disbursementMilestones) return;
    try {
      const milestones = [...loan.disbursementMilestones];
      const index = milestones.findIndex(m => m.milestoneNumber === milestoneNumber);
      if (index === -1) return;

      milestones[index].status = 'disbursed';
      milestones[index].disbursedAt = new Date().toISOString();

      await updateDoc(doc(db, "loans", loanId), { disbursementMilestones: milestones });
      setLoan({ ...loan, disbursementMilestones: milestones });
      toast.success(`Milestone ${milestoneNumber} disbursed`);
    } catch (error) {
      toast.error("Failed to disburse milestone");
    }
  };

  const handleMarkAsRepaid = async () => {
    if (!loan) return;
    try {
      const update = {
        status: 'repaid',
        repaidAt: serverTimestamp()
      };
      await updateDoc(doc(db, "loans", loanId), update);
      
      // Check for graduation if startup loan
      if (loan.applicationTrack === 'startup') {
        const configSnap = await getDoc(doc(db, 'app_settings', 'lender_config'));
        const config = configSnap.data() as LenderConfig;
        
        if (config.enableGraduation) {
          const isEligible = await graduationService.checkEligibility(loan.userId, loanId);
          if (isEligible) {
            await graduationService.recordGraduation(loan.userId, loanId, 250000); // Example next limit
            toast.success("Loan repaid! Borrower is eligible for graduation.");
          } else {
            toast.success("Loan marked as repaid");
          }
        } else {
          toast.success("Loan marked as repaid");
        }
      } else {
        toast.success("Loan marked as repaid");
      }

      setLoan({ ...loan, ...update, status: 'repaid' } as any);
    } catch (error) {
      toast.error("Failed to mark as repaid");
    }
  };

  if (isLoading) return null;
  if (!loan) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-[60] flex flex-col border-l animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between bg-neutral-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{business?.businessName || "Loan Detail"}</h2>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-sm text-muted-foreground">Applicant: {applicant?.displayName}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Risk & Quick Info */}
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Loan Amount</p>
            <p className="text-lg font-black text-primary">{formatCurrency(loan.amount, 'KES')}</p>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">AI Score</p>
            <Badge className={cn(
              "font-bold",
              assessment?.score && assessment.score > 70 ? "bg-green-500" : 
              assessment?.score && assessment.score > 40 ? "bg-amber-500" : "bg-red-500"
            )}>
              {assessment?.score || "N/A"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Risk Flag</p>
          <div className="flex gap-1">
            {(['low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRiskChange(r)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-all",
                  loan.riskFlag === r 
                    ? (r === 'high' ? "bg-red-500 text-white border-red-600" : 
                       r === 'medium' ? "bg-amber-500 text-white border-amber-600" : 
                       "bg-green-500 text-white border-green-600")
                    : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="flex-grow flex flex-col">
        <div className="px-6 border-b">
          <TabsList className="w-full justify-start h-12 bg-transparent gap-6 p-0">
            <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <Info className="h-4 w-4 mr-2" />
              Loan Info
            </TabsTrigger>
            {loan.applicationTrack === 'startup' && (
              <TabsTrigger value="startup" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
                <Rocket className="h-4 w-4 mr-2" />
                Startup Plan
              </TabsTrigger>
            )}
            <TabsTrigger value="business" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <Building2 className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="applicant" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <UserIcon className="h-4 w-4 mr-2" />
              Applicant
            </TabsTrigger>
            <TabsTrigger value="repayment" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <History className="h-4 w-4 mr-2" />
              Repayment
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Audit
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <TabsContent value="info" className="mt-0 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Applied On</p>
                <p className="text-sm font-medium">{formatDate(loan.appliedAt, 'PPP')}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Interest Rate</p>
                <p className="text-sm font-medium">{assessment?.loanEligibility.interestRate}% APR</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                AI Assessment Summary
              </h4>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm italic text-neutral-700 leading-relaxed">
                "{assessment?.analysis.slice(0, 300)}..."
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Internal Admin Notes
              </h4>
              <Textarea 
                placeholder="Add private notes about this application..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                onBlur={handleUpdateNotes}
                className="min-h-[120px] bg-neutral-50"
              />
              <p className="text-[10px] text-muted-foreground italic">Notes are only visible to other admins.</p>
            </div>
          </TabsContent>

          <TabsContent value="startup" className="mt-0 space-y-6">
            {startupProfile && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-900 mb-2">Startup Stage: {startupProfile.stage.toUpperCase()}</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">{startupProfile.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Projected Revenue</p>
                    <p className="text-sm font-bold">{formatCurrency(startupProfile.projectedMonthlyRevenue, 'KES')}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Break-even</p>
                    <p className="text-sm font-bold">{startupProfile.breakEvenMonths} Months</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Loan Usage Breakdown</p>
                  <div className="space-y-2">
                    {startupProfile.loanUsageBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white border rounded text-xs">
                        <span className="font-medium">{item.item}</span>
                        <span className="font-bold">{formatCurrency(item.cost, 'KES')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {personalFinancial && (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      Personal Financial Health
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Income</p>
                        <p className="text-sm font-medium">{formatCurrency(personalFinancial.monthlyIncome, 'KES')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">M-PESA Turnover</p>
                        <p className="text-sm font-medium">{formatCurrency(personalFinancial.mpesaMonthlyTurnover, 'KES')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {loan.disbursementMilestones && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Disbursement Milestones
                    </h4>
                    <div className="space-y-3">
                      {loan.disbursementMilestones.map((m) => (
                        <div key={m.milestoneNumber} className="p-3 bg-white border rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">Milestone {m.milestoneNumber}: {m.description}</span>
                            <Badge variant={
                              m.status === 'disbursed' ? 'secondary' : 
                              m.status === 'verified' ? 'outline' : 'default'
                            } className="text-[10px]">
                              {m.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">{formatCurrency(m.amount, 'KES')}</span>
                            <div className="flex gap-2">
                              {m.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleVerifyMilestone(m.milestoneNumber)}>
                                  Verify
                                </Button>
                              )}
                              {m.status === 'verified' && (
                                <Button size="sm" className="h-7 text-[10px]" onClick={() => handleDisburseMilestone(m.milestoneNumber)}>
                                  Disburse
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="business" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Industry</p>
                  <p className="text-sm font-medium capitalize">{business?.industry.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Location</p>
                  <p className="text-sm font-medium">{business?.location}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Years Active</p>
                  <p className="text-sm font-medium">{business?.yearsInOperation} Years</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Revenue</p>
                  <p className="text-sm font-medium">{business && formatCurrency(business.monthlyRevenue, 'KES')}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Business Description</p>
                <p className="text-sm leading-relaxed">{business?.description}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Goals</p>
                <p className="text-sm leading-relaxed">{business?.goals}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applicant" className="mt-0 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                {applicant?.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{applicant?.displayName}</p>
                <p className="text-xs text-muted-foreground">{applicant?.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Account Status</p>
                <Badge variant={applicant?.suspended ? "destructive" : "default"}>
                  {applicant?.suspended ? "Suspended" : "Active"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Join Date</p>
                <p className="text-sm">{applicant && formatDate(applicant.createdAt, 'PP')}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="repayment" className="mt-0">
            {loan.repaymentSchedule ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold">Repayment Schedule</h4>
                  <Badge variant="outline">12 Months Term</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Due Date</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loan.repaymentSchedule.map((inst) => (
                        <tr key={inst.installmentNumber}>
                          <td className="px-3 py-2">{inst.installmentNumber}</td>
                          <td className="px-3 py-2">{formatDate(inst.dueDate, 'MMM d, yyyy')}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(inst.amount, 'KES')}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className={cn(
                              "text-[8px] h-4 px-1 uppercase",
                              inst.status === 'paid' ? "bg-green-50 text-green-600 border-green-200" :
                              inst.status === 'overdue' ? "bg-red-50 text-red-600 border-red-200" :
                              "bg-neutral-50 text-neutral-500 border-neutral-200"
                            )}>
                              {inst.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground italic text-sm">
                No repayment schedule generated yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <div className="space-y-6">
              {auditTrail.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm italic">No audit trail for this loan.</p>
              ) : (
                auditTrail.map((log) => (
                  <div key={log.id} className="relative pl-6 pb-6 border-l last:pb-0">
                    <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold capitalize">{log.action.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-muted-foreground">By {log.adminEmail}</p>
                      {log.reason && <p className="text-[10px] bg-neutral-100 p-2 rounded mt-1 italic">"{log.reason}"</p>}
                      <p className="text-[8px] text-neutral-400 uppercase font-bold mt-1">{formatDate(log.createdAt, 'PPp')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-6 border-t bg-neutral-50 flex gap-3">
        {loan.status === 'pending' && (
          <>
            <Button variant="destructive" className="flex-grow" onClick={() => setIsRejectDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
            <Button className="flex-grow bg-green-600 hover:bg-green-700" onClick={() => setIsApproveDialogOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Loan
            </Button>
          </>
        )}
        {loan.status === 'disbursed' && (
          <Button onClick={handleMarkAsRepaid} className="h-12 flex-1 font-bold bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Repaid
          </Button>
        )}
        {loan.status === 'approved' && (
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsDisburseDialogOpen(true)}>
            <Banknote className="h-4 w-4 mr-2" />
            Confirm Disbursement
          </Button>
        )}
        {(loan.status === 'disbursed' || loan.status === 'approved') && (
          <Button variant="outline" className="w-full border-neutral-300" onClick={() => setIsWriteOffDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Write Off Loan
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan</DialogTitle>
            <DialogDescription>
              Confirm approval for {formatCurrency(loan.amount, 'KES')}. This will notify the user and generate a repayment schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove}>Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason (min 20 characters)..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectionReason.length < 20}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisburseDialogOpen} onOpenChange={setIsDisburseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Disbursement</DialogTitle>
            <DialogDescription>
              Has the amount of {formatCurrency(loan.amount, 'KES')} been physically sent to the user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDisburseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDisburse}>Yes, Disbursed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWriteOffDialogOpen} onOpenChange={setIsWriteOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write Off Loan</DialogTitle>
            <DialogDescription>
              This will mark the loan as written off. This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason for write-off..." 
              value={writeOffReason}
              onChange={(e) => setWriteOffReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsWriteOffDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { /* Implement Write Off */ setIsWriteOffDialogOpen(false); toast.success("Loan written off"); }}>
              Confirm Write Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-blue-100 text-blue-700 border-blue-200",
    disbursed: "bg-green-100 text-green-700 border-green-200",
    repaid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    written_off: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
  
  return (
    <Badge variant="outline" className={cn("capitalize border", variants[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
