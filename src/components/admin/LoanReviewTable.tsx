import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, onSnapshot, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { LoanApplication, BusinessProfile, AssessmentResult } from "../../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatCurrency } from "../../lib/currency";
import { formatDate } from "../../lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { notificationService } from "../../services/notifications";
import { addMonths } from "date-fns";

interface LoanReviewTableProps {
  filter: 'pending' | 'all';
}

type EnrichedLoan = LoanApplication & { business?: BusinessProfile, assessment?: AssessmentResult };

export default function LoanReviewTable({ filter }: LoanReviewTableProps) {
  const [loans, setLoans] = useState<EnrichedLoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<EnrichedLoan | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  useEffect(() => {
    const q = collection(db, "loans");
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loansData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication));
      const filtered = filter === 'pending' ? loansData.filter(l => l.status === 'pending') : loansData;
      
      // Enrich with business and assessment data
      const enriched = await Promise.all(filtered.map(async (loan) => {
        const bizDoc = await getDoc(doc(db, "businesses", loan.businessId));
        const asmtDoc = await getDoc(doc(db, "assessments", loan.assessmentId));
        return {
          ...loan,
          business: bizDoc.exists() ? bizDoc.data() as BusinessProfile : undefined,
          assessment: asmtDoc.exists() ? asmtDoc.data() as AssessmentResult : undefined,
        };
      }));
      
      setLoans(enriched.sort((a, b) => new Date(b.appliedAt as string).getTime() - new Date(a.appliedAt as string).getTime()));
    });

    return () => unsubscribe();
  }, [filter]);

  const handleApprove = async () => {
    if (!selectedLoan || !selectedLoan.assessment) return;

    const interestRate = selectedLoan.assessment.loanEligibility.interestRate / 100;
    const monthlyRate = interestRate / 12;
    const termMonths = 12;
    const monthlyPayment = (selectedLoan.amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);

    const schedule = Array.from({ length: termMonths }).map((_, i) => {
      const dueDate = addMonths(new Date(), i + 1).toISOString();
      return {
        installmentNumber: i + 1,
        dueDate,
        amount: monthlyPayment,
        principal: monthlyPayment - (selectedLoan.amount * monthlyRate), // Simplified
        interest: selectedLoan.amount * monthlyRate,
        status: 'upcoming' as const,
      };
    });

    try {
      await updateDoc(doc(db, "loans", selectedLoan.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        repaymentSchedule: schedule
      });
      
      await notificationService.sendLoanApproved(
        selectedLoan.userId, 
        selectedLoan.id, 
        formatCurrency(selectedLoan.amount, 'KES')
      );
      
      toast.success("Loan approved and schedule generated");
      setIsApproveDialogOpen(false);
    } catch (error) {
      toast.error("Failed to approve loan");
    }
  };

  const handleReject = async () => {
    if (!selectedLoan || rejectionReason.length < 10) {
      toast.error("Please provide a detailed reason (min 10 chars)");
      return;
    }

    try {
      await updateDoc(doc(db, "loans", selectedLoan.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason
      });

      await notificationService.sendLoanRejected(selectedLoan.userId, selectedLoan.id, rejectionReason);
      
      toast.success("Loan application rejected");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject loan");
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No loan applications found
              </TableCell>
            </TableRow>
          ) : (
            loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>
                  <div className="font-medium">{loan.business?.businessName || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{loan.business?.industry}</div>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(loan.amount, 'KES')}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(loan.appliedAt, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={loan.assessment?.score && loan.assessment.score > 70 ? "default" : "secondary"}>
                    {loan.assessment?.score || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    loan.status === 'approved' ? 'default' : 
                    loan.status === 'rejected' ? 'destructive' : 'outline'
                  } className="capitalize">
                    {loan.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {loan.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => { setSelectedLoan(loan); setIsApproveDialogOpen(true); }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/5"
                        onClick={() => { setSelectedLoan(loan); setIsRejectDialogOpen(true); }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this loan for {selectedLoan?.business?.businessName}?
              This will generate a 12-month repayment schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold">{selectedLoan && formatCurrency(selectedLoan.amount, 'KES')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate:</span>
              <span className="font-bold">{selectedLoan?.assessment?.loanEligibility.interestRate}% APR</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove}>Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason for rejection (min 10 characters)..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectionReason.length < 10}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
