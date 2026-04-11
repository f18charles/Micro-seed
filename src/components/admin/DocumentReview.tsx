import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Search,
  Filter,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SubmittedDocument, DocumentStatus } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DocumentReview() {
  const [documents, setDocuments] = useState<SubmittedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('pending_review');
  const [selectedDoc, setSelectedDoc] = useState<SubmittedDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "documents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data() as SubmittedDocument);
      setDocuments(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (docId: string, status: DocumentStatus) => {
    if (status === 'rejected' && !rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsActioning(true);
    try {
      const admin = auth.currentUser;
      await updateDoc(doc(db, 'documents', docId), {
        status,
        reviewedBy: admin?.uid,
        reviewedAt: serverTimestamp(),
        rejectionReason: status === 'rejected' ? rejectionReason : null
      });
      toast.success(`Document ${status} successfully`);
      setSelectedDoc(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setIsActioning(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = a.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0;
    const dateB = b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0;
    return dateB - dateA;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-500">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-500">Flagged</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search by filename or User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending_review', 'verified', 'rejected', 'flagged'] as const).map((s) => (
            <Button 
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applicant ID</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No documents found matching filters
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        <FileText className="w-4 h-4 text-neutral-500" />
                      </div>
                      <span className="font-medium text-sm truncate max-w-[150px]">{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{doc.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{doc.userId.slice(0, 8)}...</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.uploadedAt ? format(new Date(doc.uploadedAt.toString()), 'MMM d, HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(doc)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Document: {selectedDoc?.fileName}
              {selectedDoc && getStatusBadge(selectedDoc.status)}
            </DialogTitle>
            <DialogDescription>
              Type: <span className="capitalize font-bold">{selectedDoc?.type.replace('_', ' ')}</span> • 
              Size: {(selectedDoc?.fileSizeBytes || 0 / (1024 * 1024)).toFixed(2)} MB
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="aspect-video bg-neutral-100 rounded-xl border flex items-center justify-center overflow-hidden">
              {selectedDoc?.mimeType.startsWith('image/') ? (
                <img src={selectedDoc.fileUrl} alt="Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-center space-y-4">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto" />
                  <p className="text-sm font-medium">PDF Document Preview Not Available</p>
                  <Button onClick={() => window.open(selectedDoc?.fileUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                  </Button>
                </div>
              )}
            </div>

            {selectedDoc?.status === 'pending_review' && (
              <div className="space-y-4 p-4 border rounded-xl bg-neutral-50">
                <Label>Rejection Reason (Required if rejecting)</Label>
                <Textarea 
                  placeholder="e.g. Image is blurry, ID is expired, document is incomplete..." 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedDoc?.status === 'pending_review' ? (
              <>
                <Button 
                  variant="outline" 
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => handleUpdateStatus(selectedDoc.id, 'flagged')}
                  disabled={isActioning}
                >
                  <ShieldAlert className="w-4 h-4 mr-2" /> Flag for Fraud
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateStatus(selectedDoc.id, 'rejected')}
                  disabled={isActioning}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateStatus(selectedDoc.id, 'verified')}
                  disabled={isActioning}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Verify & Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
