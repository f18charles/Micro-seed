import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useDocumentUpload } from '../services/documentService';
import { SubmittedDocument, DocumentType } from '../types';
import { cn } from '../lib/utils';

interface DocumentUploadProps {
  documentType: DocumentType;
  label: string;
  description: string;
  required: boolean;
  userId: string;
  applicationId?: string;
  guarantorId?: string;
  acceptedTypes?: string[];
  existingDocument?: SubmittedDocument | null;
  onUploadComplete: (doc: SubmittedDocument) => void;
  onDelete?: (doc: SubmittedDocument) => void;
  periodRequired?: boolean;
}

export default function DocumentUpload({
  documentType,
  label,
  description,
  required,
  userId,
  applicationId,
  guarantorId,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  existingDocument,
  onUploadComplete,
  onDelete,
  periodRequired
}: DocumentUploadProps) {
  const { upload, progress, isUploading, error, reset } = useDocumentUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [period, setPeriod] = useState({ from: '', to: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (periodRequired && (!period.from || !period.to)) {
      alert("Please specify the period covered by this document first.");
      return;
    }

    const metadata: Partial<SubmittedDocument> = {
      type: documentType,
      loanApplicationId: applicationId,
      guarantorId: guarantorId,
      periodCovered: periodRequired ? period : undefined
    };

    const result = await upload(file, userId, metadata);
    if (result) {
      onUploadComplete(result);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertCircle className="w-3 h-3 mr-1" /> Flagged</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <Label className="text-base font-bold flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {existingDocument && getStatusBadge(existingDocument.status)}
      </div>

      {periodRequired && !existingDocument && (
        <div className="grid grid-cols-2 gap-4 pb-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Statement From</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="date" 
                className="pl-9" 
                value={period.from}
                onChange={(e) => setPeriod(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Statement To</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="date" 
                className="pl-9" 
                value={period.to}
                onChange={(e) => setPeriod(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {existingDocument ? (
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-dashed">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">{existingDocument.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {(existingDocument.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open(existingDocument.fileUrl, '_blank')}>
              View
            </Button>
            {onDelete && existingDocument.status !== 'verified' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(existingDocument)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative group cursor-pointer border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-3",
            isDragging ? "border-primary bg-primary/5" : "border-neutral-200 hover:border-primary/50 hover:bg-neutral-50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={acceptedTypes.join(',')}
            onChange={onFileSelect}
          />
          
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">Uploading...</p>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <>
              <div className="p-3 bg-neutral-100 rounded-full text-neutral-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Click or drag to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG (max 10MB)</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded-lg">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {existingDocument?.rejectionReason && (
        <div className="text-xs text-destructive font-medium p-2 bg-red-50 rounded-lg border border-red-100">
          Reason for rejection: {existingDocument.rejectionReason}
        </div>
      )}
    </div>
  );
}
