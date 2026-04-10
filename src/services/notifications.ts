import { createNotification } from "../firebase";

export const notificationService = {
  async sendLoanApproved(userId: string, loanId: string, amount: string) {
    await createNotification(
      userId,
      'loan_approved',
      'Loan Approved! 🎉',
      `Your loan application for ${amount} has been approved. Check your dashboard for the repayment schedule.`,
      loanId
    );
  },

  async sendLoanRejected(userId: string, loanId: string, reason: string) {
    await createNotification(
      userId,
      'loan_rejected',
      'Loan Application Update',
      `Your loan application was not approved at this time. Reason: ${reason}`,
      loanId
    );
  },

  async sendLoanDisbursed(userId: string, loanId: string, amount: string) {
    await createNotification(
      userId,
      'loan_disbursed',
      'Funds Disbursed 💸',
      `The funds for your loan (${amount}) have been disbursed to your account.`,
      loanId
    );
  },

  async sendAssessmentComplete(userId: string, businessName: string, score: number) {
    await createNotification(
      userId,
      'assessment_complete',
      'Assessment Complete 📊',
      `The AI assessment for ${businessName} is ready. Your potential score is ${score}/100.`,
    );
  }
};
