import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  PaymentTransaction, 
  PaymentMethod, 
  PaymentDirection, 
  LoanApplication, 
  Currency 
} from '../types';

export const paymentService = {
  async initiateDisbursement(
    loan: LoanApplication, 
    method: PaymentMethod, 
    recipient: string
  ): Promise<PaymentTransaction> {
    const transactionId = 'pay_' + Date.now();
    const transaction: PaymentTransaction = {
      id: transactionId,
      loanId: loan.id,
      userId: loan.userId,
      direction: 'disbursement',
      method,
      amount: loan.amount,
      currency: 'KES', // Default for this app
      status: 'initiated',
      phoneNumber: method === 'mpesa' ? recipient : undefined,
      accountNumber: method === 'bank_transfer' ? recipient : undefined,
      initiatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'payments', transactionId), transaction);

    // In a real app, this would trigger a cloud function to call M-PESA B2C API
    // For this spec, we simulate the initiation
    if (method === 'mpesa') {
      // Simulate API call
      console.log(`Initiating M-PESA B2C to ${recipient} for KSh ${loan.amount}`);
    }

    return transaction;
  },

  async confirmPaymentReceived(
    transactionId: string, 
    referenceNumber: string, 
    confirmedBy: string
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const payRef = doc(db, 'payments', transactionId);
      const paySnap = await transaction.get(payRef);
      if (!paySnap.exists()) throw new Error("Transaction not found");
      
      const payData = paySnap.data() as PaymentTransaction;
      
      transaction.update(payRef, {
        status: 'completed',
        referenceNumber,
        completedAt: serverTimestamp(),
        confirmedBy
      });

      if (payData.direction === 'repayment' && payData.installmentNumber !== undefined) {
        const loanRef = doc(db, 'loans', payData.loanId);
        const loanSnap = await transaction.get(loanRef);
        if (loanSnap.exists()) {
          const loanData = loanSnap.data() as LoanApplication;
          const updatedSchedule = loanData.repaymentSchedule?.map(inst => {
            if (inst.installmentNumber === payData.installmentNumber) {
              return { ...inst, status: 'paid', paidAt: new Date().toISOString() };
            }
            return inst;
          });

          const allPaid = updatedSchedule?.every(inst => inst.status === 'paid');
          
          transaction.update(loanRef, {
            repaymentSchedule: updatedSchedule,
            status: allPaid ? 'repaid' : loanData.status,
            repaidAt: allPaid ? serverTimestamp() : null
          });
        }
      }
    });
  },

  async recordRepayment(
    loanId: string, 
    installmentNumber: number, 
    amount: number, 
    method: PaymentMethod, 
    reference: string, 
    confirmedBy: string
  ): Promise<PaymentTransaction> {
    const loanSnap = await getDoc(doc(db, 'loans', loanId));
    if (!loanSnap.exists()) throw new Error("Loan not found");
    const loan = loanSnap.data() as LoanApplication;

    const transactionId = 'pay_' + Date.now();
    const transaction: PaymentTransaction = {
      id: transactionId,
      loanId,
      userId: loan.userId,
      direction: 'repayment',
      method,
      amount,
      currency: 'KES',
      status: 'completed',
      referenceNumber: reference,
      installmentNumber,
      initiatedAt: serverTimestamp() as any,
      completedAt: serverTimestamp() as any,
      confirmedBy
    };

    await setDoc(doc(db, 'payments', transactionId), transaction);

    // Update loan schedule
    const updatedSchedule = loan.repaymentSchedule?.map(inst => {
      if (inst.installmentNumber === installmentNumber) {
        return { ...inst, status: 'paid', paidAt: new Date().toISOString() };
      }
      return inst;
    });

    const allPaid = updatedSchedule?.every(inst => inst.status === 'paid');
    
    await updateDoc(doc(db, 'loans', loanId), {
      repaymentSchedule: updatedSchedule,
      status: allPaid ? 'repaid' : loan.status,
      repaidAt: allPaid ? serverTimestamp() : null
    });

    return transaction;
  }
};
