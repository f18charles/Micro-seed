import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import DocumentUpload from './DocumentUpload';
import { db, auth, serverTimestamp } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { KycRecord, KycStatus, SubmittedDocument, UserProfile } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface KycFormProps {
  onComplete: () => void;
  existingRecord?: KycRecord | null;
}

export default function KycForm({ onComplete, existingRecord }: KycFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullLegalName: '',
    dateOfBirth: '',
    physicalAddress: '',
    nationalIdNumber: '',
    confirmIdNumber: '',
    kraPinNumber: '',
    confirmKraPin: '',
    phone: '',
    confirmPhone: ''
  });
  const [documents, setDocuments] = useState<Record<string, SubmittedDocument>>({});
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (existingRecord) {
      setFormData(prev => ({
        ...prev,
        fullLegalName: existingRecord.fullLegalName || '',
        dateOfBirth: existingRecord.dateOfBirth || '',
        physicalAddress: existingRecord.physicalAddress || '',
        phone: existingRecord.userId ? '' : '', // We don't pre-fill sensitive masked data usually
      }));
    }
  }, [existingRecord]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentUpload = (doc: SubmittedDocument) => {
    setDocuments(prev => ({ ...prev, [doc.type]: doc }));
  };

  const validateStep1 = () => {
    if (!formData.fullLegalName || !formData.dateOfBirth || !formData.physicalAddress || !formData.nationalIdNumber || !formData.kraPinNumber) {
      toast.error("Please fill in all identity fields");
      return false;
    }
    if (formData.nationalIdNumber !== formData.confirmIdNumber) {
      toast.error("National ID numbers do not match");
      return false;
    }
    if (formData.kraPinNumber !== formData.confirmKraPin) {
      toast.error("KRA PIN numbers do not match");
      return false;
    }
    if (!documents['national_id'] || !documents['nationalidback'] || !documents['kra_pin']) {
      toast.error("Please upload all required identity documents");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone || formData.phone !== formData.confirmPhone) {
      toast.error("Phone numbers must match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!consent) {
      toast.error("You must agree to the consent statement");
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const kycData: KycRecord = {
        id: user.uid,
        userId: user.uid,
        status: 'submitted',
        fullLegalName: formData.fullLegalName,
        dateOfBirth: formData.dateOfBirth,
        physicalAddress: formData.physicalAddress,
        nationalIdNumber: formData.nationalIdNumber, // In real app, encrypt this
        kraPinNumber: formData.kraPinNumber,
        documentIds: Object.values(documents).map(d => d.id),
        submittedAt: serverTimestamp() as any
      };

      await setDoc(doc(db, 'kyc_records', user.uid), kycData);
      await updateDoc(doc(db, 'users', user.uid), { kycStatus: 'submitted' });
      
      toast.success("KYC submitted for verification");
      onComplete();
    } catch (error: any) {
      toast.error("Failed to submit KYC: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Legal Name (as on ID)</Label>
          <Input name="fullLegalName" value={formData.fullLegalName} onChange={handleInputChange} placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Physical Address</Label>
        <Input name="physicalAddress" value={formData.physicalAddress} onChange={handleInputChange} placeholder="County, Town, Street" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>National ID Number</Label>
          <Input name="nationalIdNumber" type="password" value={formData.nationalIdNumber} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label>Confirm ID Number</Label>
          <Input name="confirmIdNumber" type="password" value={formData.confirmIdNumber} onChange={handleInputChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>KRA PIN Number</Label>
          <Input name="kraPinNumber" type="password" value={formData.kraPinNumber} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label>Confirm KRA PIN</Label>
          <Input name="confirmKraPin" type="password" value={formData.confirmKraPin} onChange={handleInputChange} />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-bold">Identity Documents</Label>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DocumentUpload 
            documentType="national_id" 
            label="National ID Front" 
            description="Clear photo of the front of your ID" 
            required={true} 
            userId={auth.currentUser?.uid || ''} 
            onUploadComplete={handleDocumentUpload}
            existingDocument={documents['national_id']}
          />
          <DocumentUpload 
            documentType="nationalidback" 
            label="National ID Back" 
            description="Clear photo of the back of your ID" 
            required={true} 
            userId={auth.currentUser?.uid || ''} 
            onUploadComplete={handleDocumentUpload}
            existingDocument={documents['nationalidback']}
          />
          <DocumentUpload 
            documentType="kra_pin" 
            label="KRA PIN Certificate" 
            description="PDF or photo of your KRA PIN certificate" 
            required={true} 
            userId={auth.currentUser?.uid || ''} 
            onUploadComplete={handleDocumentUpload}
            existingDocument={documents['kra_pin']}
          />
        </div>
      </div>

      <Button className="w-full h-12 text-lg" onClick={() => validateStep1() && setStep(2)}>
        Next: Contact Verification <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
        <Phone className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800">
          Please provide your primary phone number. This <strong>must</strong> match your M-PESA registered number for loan disbursements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07XXXXXXXX" />
        </div>
        <div className="space-y-2">
          <Label>Confirm Phone Number</Label>
          <Input name="confirmPhone" value={formData.confirmPhone} onChange={handleInputChange} placeholder="07XXXXXXXX" />
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button className="flex-[2] h-12 text-lg" onClick={() => validateStep2() && setStep(3)}>
          Next: Review & Consent <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="bg-neutral-50 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Review Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Legal Name:</span>
            <span className="font-medium">{formData.fullLegalName}</span>
            <span className="text-muted-foreground">ID Number:</span>
            <span className="font-medium">********{formData.nationalIdNumber.slice(-4)}</span>
            <span className="text-muted-foreground">KRA PIN:</span>
            <span className="font-medium">********{formData.kraPinNumber.slice(-4)}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{formData.phone}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 p-6 bg-white border rounded-xl shadow-sm">
        <div className="flex gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          <div className="space-y-2">
            <h3 className="font-bold">Consent Statement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I confirm that all information and documents submitted are genuine and accurate. I understand that providing false information is a criminal offence under Kenyan law. I consent to MicroSeed and the lender retaining my KYC information for the purposes of credit assessment and legal recourse in the event of loan default.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <input 
            type="checkbox" 
            id="consent" 
            checked={consent} 
            onChange={(e) => setConsent(e.target.checked)}
            className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
          />
          <label htmlFor="consent" className="text-sm font-medium cursor-pointer">
            I have read and agree to the above statement
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button 
          className="flex-[2] h-12 text-lg" 
          disabled={!consent || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          Submit for Verification
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Identity Verification</h1>
        <p className="text-muted-foreground">Complete your KYC to unlock loan applications</p>
        
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-2 w-12 rounded-full transition-all duration-300",
                step >= s ? "bg-primary" : "bg-neutral-200"
              )} 
            />
          ))}
        </div>
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
