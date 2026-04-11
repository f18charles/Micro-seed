import { 
  getDocs, 
  query, 
  collection, 
  where, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { LoanApplication, GraduationRecord } from "../types";

export const graduationService = {
  async checkEligibility(userId: string, loanId: string): Promise<boolean> {
    const record = await checkGraduationEligibility(loanId, userId);
    return record?.eligibleForGraduation || false;
  },

  async recordGraduation(userId: string, loanId: string, nextLimit: number): Promise<void> {
    // This is already handled inside checkGraduationEligibility by setDoc
    // But we can add extra logic if needed, like updating user profile
    await updateDoc(doc(db, 'users', userId), {
      graduationStatus: 'eligible',
      maxGraduationAmount: nextLimit
    });
  }
};

export async function checkGraduationEligibility(loanId: string, userId: string): Promise<GraduationRecord | null> {
  try {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);
    
    if (!loanSnap.exists()) return null;
    const loan = { id: loanSnap.id, ...loanSnap.data() } as LoanApplication;

    if (loan.status !== 'repaid') return null;

    // 1. Check repayment history
    const repayments = loan.repaymentSchedule || [];
    const onTimeCount = repayments.filter(r => r.status === 'paid' && r.paidAt).length; // Simplified check
    const totalCount = repayments.length;
    
    const repaymentScore = totalCount > 0 ? (onTimeCount / totalCount) * 100 : 0;

    // 2. Check milestones (if applicable)
    const milestones = loan.disbursementMilestones || [];
    const missedMilestones = milestones.filter(m => m.status === 'missed').length;

    // 3. Eligibility Logic
    const eligible = repaymentScore >= 60 && missedMilestones === 0;

    // 4. Calculate Max Amount
    let multiplier = 0;
    if (repaymentScore >= 90) multiplier = 3;
    else if (repaymentScore >= 75) multiplier = 2;
    else if (repaymentScore >= 60) multiplier = 1.5;

    const graduationMax = loan.amount * multiplier;

    const record: GraduationRecord = {
      id: 'grad_' + loanId,
      userId,
      originalLoanId: loanId,
      businessProfileId: loan.businessId,
      repaymentsOnTime: onTimeCount,
      repaymentsTotal: totalCount,
      repaymentScore,
      businessNowOperating: true, // Assume true if they repaid a startup loan
      revenueVerified: false,
      eligibleForGraduation: eligible,
      graduationLoanMaxAmount: graduationMax,
      assessedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'graduation_records', record.id), {
      ...record,
      assessedAt: serverTimestamp()
    });

    return record;
  } catch (error) {
    console.error("Error checking graduation eligibility:", error);
    return null;
  }
}
