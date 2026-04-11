import React, { useState } from 'react';
import { 
  FileUp, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import DocumentUpload from './DocumentUpload';
import { db, serverTimestamp } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Guarantor, SubmittedDocument } from '../types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface GuarantorDocumentsProps {
  guarantor: Guarantor;
  onComplete: () => void;
}

export default function GuarantorDocuments({ guarantor, onComplete }: GuarantorDocumentsProps) {
  const [documents, setDocuments] = useState<Record<string, SubmittedDocument>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (docData: SubmittedDocument) => {
    setDocuments(prev => ({ ...prev, [docData.type]: docData }));
    
    // Update guarantor record with document ID
    await updateDoc(doc(db, 'guarantors', guarantor.id), {
      documents: arrayUnion(docData.id)
    });
  };

  const handleSubmit = async () => {
    if (!documents['national_id'] || !documents['kra_pin']) {
      toast.error("Please upload both your National ID and KRA PIN certificate");
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'guarantors', guarantor.id), {
        status: 'documents_submitted',
        updatedAt: serverTimestamp()
      });
      toast.success("Documents submitted successfully!");
      onComplete();
    } catch (error: any) {
      toast.error("Failed to submit: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="bg-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <FileUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Verify Your Identity</h1>
          <p className="text-muted-foreground">As a guarantor, we need to verify your documents</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>Please upload clear copies of the following documents:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUpload 
              documentType="national_id" 
              label="National ID Front" 
              description="Clear photo of the front of your ID" 
              required={true} 
              userId={guarantor.applicantUserId} // Associated with applicant's folder but marked as guarantor doc
              guarantorId={guarantor.id}
              onUploadComplete={handleUpload}
              existingDocument={documents['national_id']}
            />
            
            <DocumentUpload 
              documentType="kra_pin" 
              label="KRA PIN Certificate" 
              description="PDF or photo of your KRA PIN certificate" 
              required={true} 
              userId={guarantor.applicantUserId}
              guarantorId={guarantor.id}
              onUploadComplete={handleUpload}
              existingDocument={documents['kra_pin']}
            />

            <Button 
              className="w-full h-14 text-xl font-black" 
              disabled={!documents['national_id'] || !documents['kra_pin'] || isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
              Complete Verification
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            Your documents are stored securely and only accessible to authorized administrators for verification purposes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
