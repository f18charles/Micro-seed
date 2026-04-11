import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Smartphone,
  Banknote,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../ui/dialog';
import { Label } from '../ui/label';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PaymentTransaction, PaymentStatus, PaymentMethod } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function PaymentGateway() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'disbursements' | 'repayments'>('all');
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [confirmRef, setConfirmRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("initiatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(d => d.data() as PaymentTransaction);
      setTransactions(txs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirm = async () => {
    if (!selectedTx || !confirmRef) return;
    setIsProcessing(true);
    try {
      const admin = auth.currentUser;
      await updateDoc(doc(db, 'payments', selectedTx.id), {
        status: 'completed',
        referenceNumber: confirmRef,
        completedAt: serverTimestamp(),
        confirmedBy: admin?.uid
      });
      
      // If it's a repayment, update the loan schedule (handled by service in real app)
      // For this spec, we'll assume the service logic is triggered or we do it here
      
      toast.success("Transaction confirmed successfully");
      setSelectedTx(null);
      setConfirmRef('');
    } catch (error: any) {
      toast.error("Confirmation failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'disbursements' && tx.direction === 'disbursement') ||
                      (activeTab === 'repayments' && tx.direction === 'repayment');
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'pending': return <Badge className="bg-amber-500">Pending</Badge>;
      case 'initiated': return <Badge variant="secondary">Initiated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'mpesa': return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'bank_transfer': return <Banknote className="w-4 h-4 text-blue-600" />;
      default: return <CreditCard className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6 space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Total Disbursed</p>
            <p className="text-3xl font-black">KSh {transactions.filter(t => t.direction === 'disbursement' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6 space-y-1">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Total Repaid</p>
            <p className="text-3xl font-black">KSh {transactions.filter(t => t.direction === 'repayment' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-6 space-y-1">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Confirmation</p>
            <p className="text-3xl font-black">{transactions.filter(t => t.status === 'pending' || t.status === 'initiated').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search by ID, User, or Reference..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          {(['all', 'disbursements', 'repayments'] as const).map((t) => (
            <Button 
              key={t}
              variant={activeTab === t ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(t)}
              className={cn("capitalize px-4", activeTab === t && "shadow-sm")}
            >
              {t}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredTxs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTxs.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.direction === 'disbursement' ? (
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      )}
                      <span className="capitalize text-sm font-medium">{tx.direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(tx.method)}
                      <span className="capitalize text-xs">{tx.method.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">KSh {tx.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.initiatedAt ? format(new Date(tx.initiatedAt.toString()), 'MMM d, HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                          <FileText className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {(tx.status === 'pending' || tx.status === 'initiated') && (
                          <DropdownMenuItem className="text-green-600" onClick={() => setSelectedTx(tx)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>ID: {selectedTx?.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Direction</p>
                <p className="font-bold capitalize">{selectedTx?.direction}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Amount</p>
                <p className="font-bold">KSh {selectedTx?.amount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Method</p>
                <p className="font-bold capitalize">{selectedTx?.method.replace('_', ' ')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Status</p>
                <div>{selectedTx && getStatusBadge(selectedTx.status)}</div>
              </div>
              {selectedTx?.referenceNumber && (
                <div className="space-y-1 col-span-2">
                  <p className="text-muted-foreground">Reference Number</p>
                  <p className="font-mono font-bold">{selectedTx.referenceNumber}</p>
                </div>
              )}
            </div>

            {(selectedTx?.status === 'pending' || selectedTx?.status === 'initiated') && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Confirmation Reference (M-PESA Code / Bank Ref)</Label>
                <Input 
                  placeholder="Enter confirmation code..." 
                  value={confirmRef}
                  onChange={(e) => setConfirmRef(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTx(null)}>Close</Button>
            {(selectedTx?.status === 'pending' || selectedTx?.status === 'initiated') && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={!confirmRef || isProcessing}
                onClick={handleConfirm}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
