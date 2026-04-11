import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Guarantor, LoanApplication, BusinessProfile } from '../types';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import GuarantorDocuments from './GuarantorDocuments';

export default function GuarantorConsent() {
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError("Invalid or missing guarantor token");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const gSnap = await getDoc(doc(db, 'guarantors', token));
        if (!gSnap.exists()) {
          setError("Guarantor invitation not found");
          return;
        }
        const gData = gSnap.data() as Guarantor;
        setGuarantor(gData);

        const lSnap = await getDoc(doc(db, 'loans', gData.loanApplicationId));
        if (lSnap.exists()) setLoan(lSnap.data() as LoanApplication);

        const bSnap = await getDoc(doc(db, 'businesses', gData.loanApplicationId.replace('loan_', 'biz_'))); // Simple mapping or fetch from loan
        // In a real app, loan has businessId
        if (lSnap.exists()) {
          const lData = lSnap.data() as LoanApplication;
          const bSnapReal = await getDoc(doc(db, 'businesses', lData.businessId));
          if (bSnapReal.exists()) setBusiness(bSnapReal.data() as BusinessProfile);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!guarantor) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'guarantors', guarantor.id), {
        status: status === 'accepted' ? 'documents_pending' : 'declined',
        respondedAt: serverTimestamp(),
        consentAcceptedAt: status === 'accepted' ? serverTimestamp() : null,
        ipAddress: window.location.hostname // Basic IP capture
      });
      
      setGuarantor(prev => prev ? { ...prev, status: status === 'accepted' ? 'documents_pending' : 'declined' } : null);
      toast.success(status === 'accepted' ? "Consent recorded. Please upload your documents." : "Invitation declined.");
    } catch (err: any) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <Card className="max-w-md w-full border-red-100 bg-red-50">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-red-900">Error</h1>
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guarantor) return null;

  if (guarantor.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-bold">Invitation Declined</h1>
            <p className="text-muted-foreground">You have declined the invitation to guarantee this loan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (guarantor.status === 'documents_pending' || guarantor.status === 'documents_submitted' || guarantor.status === 'verified') {
    return <GuarantorDocuments guarantor={guarantor} onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Guarantor Consent</h1>
          <p className="text-muted-foreground">Review the loan details and provide your consent</p>
        </div>

        <Card className="border-2 border-primary/10 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-lg">Loan Details</CardTitle>
            <CardDescription>You are being asked to guarantee the following loan:</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Borrower</p>
                <p className="text-lg font-black">{guarantor.fullName}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Business</p>
                <p className="text-lg font-black">{business?.businessName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Loan Amount</p>
                <p className="text-2xl font-black text-primary">KSh {loan?.amount.toLocaleString()}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Term</p>
                <p className="text-lg font-black">{loan?.termMonths || 12} Months</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                As a guarantor, you are confirming that you know the borrower and believe they will repay this loan. In the event of default, you may be contacted to assist in recovery.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Consent Agreement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-neutral-50 rounded-xl border italic text-neutral-700 leading-relaxed">
              "{guarantor.consentText}"
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-14 text-lg font-bold border-red-200 text-red-600 hover:bg-red-50"
                disabled={isProcessing}
                onClick={() => handleResponse('declined')}
              >
                <XCircle className="w-5 h-5 mr-2" /> Decline
              </Button>
              <Button 
                className="flex-[2] h-14 text-lg font-black shadow-lg shadow-primary/20"
                disabled={isProcessing}
                onClick={() => handleResponse('accepted')}
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
                I Accept & Consent
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By clicking "I Accept", your IP address and timestamp will be recorded as a digital signature.
        </p>
      </motion.div>
    </div>
  );
}
