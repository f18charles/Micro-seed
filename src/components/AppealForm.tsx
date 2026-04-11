import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import DocumentUpload from './DocumentUpload';
import { db, auth, serverTimestamp } from '../firebase';
import { collection, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';
import { LoanApplication, LoanAppeal, SubmittedDocument } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AppealFormProps {
  loan: LoanApplication;
  onComplete: () => void;
}

export default function AppealForm({ loan, onComplete }: AppealFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    category: ''
  });
  const [documents, setDocuments] = useState<Record<string, SubmittedDocument>>({});

  const handleDocumentUpload = (doc: SubmittedDocument) => {
    setDocuments(prev => ({ ...prev, [doc.type]: doc }));
  };

  const handleSubmit = async () => {
    if (formData.reason.length < 100) {
      toast.error("Please provide a more detailed explanation (min 100 characters)");
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const appealId = 'appeal_' + Date.now();
      const appealData: LoanAppeal = {
        id: appealId,
        originalLoanId: loan.id,
        applicantUserId: user.uid,
        businessId: loan.businessId,
        status: 'submitted',
        appealReason: formData.reason,
        businessPlanDocumentId: documents['business_plan']?.id,
        guarantorIds: loan.guarantorIds || [],
        submittedAt: serverTimestamp() as any
      };

      await setDoc(doc(db, 'appeals', appealId), appealData);
      await updateDoc(doc(db, 'loans', loan.id), { appealId });
      
      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', // In real app, notify all admins or a specific queue
        type: 'appeal_submitted',
        title: 'New Loan Appeal',
        message: `An appeal has been submitted for loan ${loan.id}`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success("Appeal submitted successfully");
      onComplete();
    } catch (error: any) {
      toast.error("Failed to submit appeal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Primary Reason for Appeal</Label>
        <Select 
          value={formData.category} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="incomplete_records">My financial documents were incomplete but I now have full records</SelectItem>
            <SelectItem value="ai_mismatch">The AI assessment did not reflect my actual business performance</SelectItem>
            <SelectItem value="business_plan">I have a clear business plan that was not considered</SelectItem>
            <SelectItem value="technical_error">There was a technical error in my submission</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Detailed Explanation</Label>
        <Textarea 
          className="min-h-[200px] text-base leading-relaxed"
          placeholder="Explain why you believe your application should be reconsidered..."
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.reason.length} / 100 characters minimum
        </p>
      </div>

      <Button 
        className="w-full h-12 text-lg" 
        disabled={!formData.category || formData.reason.length < 100}
        onClick={() => setStep(2)}
      >
        Next: Supporting Documents <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          A comprehensive <strong>Business Plan</strong> is required for all appeals. This helps us understand your growth strategy and repayment capability.
        </p>
      </div>

      <DocumentUpload 
        documentType="business_plan" 
        label="Business Plan (PDF)" 
        description="Include executive summary, market analysis, and financial projections" 
        required={true} 
        userId={auth.currentUser?.uid || ''} 
        onUploadComplete={handleDocumentUpload}
        existingDocument={documents['business_plan']}
      />

      <div className="space-y-4">
        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Additional Evidence (Optional)</Label>
        <DocumentUpload 
          documentType="other" 
          label="Additional Financial Records" 
          description="Any other documents that support your appeal" 
          required={false} 
          userId={auth.currentUser?.uid || ''} 
          onUploadComplete={handleDocumentUpload}
          existingDocument={documents['other']}
        />
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button 
          className="flex-[2] h-12 text-lg" 
          disabled={!documents['business_plan']}
          onClick={() => setStep(3)}
        >
          Next: Review & Submit <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="bg-neutral-50 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Appeal Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Category</p>
            <p className="font-medium">{formData.category.replace('_', ' ')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Documents Attached</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.keys(documents).map(type => (
                <Badge key={type} variant="secondary" className="capitalize">{type.replace('_', ' ')}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4">
        <div className="flex gap-3">
          <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            I confirm this appeal is made in good faith with accurate information. I understand that the decision on this appeal will be final.
          </p>
        </div>
        
        <Button 
          className="w-full h-14 text-xl font-black shadow-lg shadow-primary/20" 
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Scale className="w-6 h-6 mr-2" />}
          Submit Final Appeal
        </Button>
      </div>

      <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Documents
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 text-center space-y-2">
        <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Loan Appeal</h1>
        <p className="text-muted-foreground">Request a reconsideration of your loan decision</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
