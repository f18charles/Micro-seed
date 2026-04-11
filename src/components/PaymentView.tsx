import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  History, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileUp,
  ArrowRight,
  Copy,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LoanApplication, RepaymentSchedule } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface PaymentViewProps {
  loan: LoanApplication;
}

export default function PaymentView({ loan }: PaymentViewProps) {
  const [activeTab, setActiveTab] = useState<'next' | 'history'>('next');

  const nextInstallment = loan.repaymentSchedule?.find(i => i.status !== 'paid');
  const paidInstallments = loan.repaymentSchedule?.filter(i => i.status === 'paid') || [];
  const totalAmount = loan.repaymentSchedule?.reduce((sum, i) => sum + i.amount, 0) || 0;
  const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const progress = (paidAmount / totalAmount) * 100;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Repayments
          </h2>
          <p className="text-sm text-muted-foreground">Manage your loan repayments and history</p>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <Button 
            variant={activeTab === 'next' ? 'secondary' : 'ghost'} 
            size="sm"
            className={cn("px-4", activeTab === 'next' && "shadow-sm")}
            onClick={() => setActiveTab('next')}
          >
            Next Payment
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
            size="sm"
            className={cn("px-4", activeTab === 'history' && "shadow-sm")}
            onClick={() => setActiveTab('history')}
          >
            History
          </Button>
        </div>
      </div>

      <Card className="border-2 border-primary/10 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Loan Progress</p>
              <p className="text-2xl font-black">KSh {paidAmount.toLocaleString()} / {totalAmount.toLocaleString()}</p>
            </div>
            <p className="text-sm font-bold text-primary">{Math.round(progress)}% Paid</p>
          </div>
          <Progress value={progress} className="h-3 bg-primary/10" />
        </CardContent>
      </Card>

      {activeTab === 'next' ? (
        <div className="space-y-6">
          {nextInstallment ? (
            <>
              <Card className="border-2 border-primary shadow-xl shadow-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Upcoming Installment</CardTitle>
                      <p className="text-4xl font-black text-primary">KSh {nextInstallment.amount.toLocaleString()}</p>
                    </div>
                    <Badge variant={nextInstallment.status === 'overdue' ? 'destructive' : 'secondary'} className="px-3 py-1">
                      {nextInstallment.status === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Due Date: {format(new Date(nextInstallment.dueDate.toString()), 'PPP')}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-bold flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      How to Pay via M-PESA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-xl border space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Paybill Number</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black">400200</p>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard('400200', 'Paybill')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-xl border space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Account Number</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black">{loan.id}</p>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loan.id, 'Account Number')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-bold flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary" />
                      Bank Transfer Details
                    </h3>
                    <div className="p-4 bg-neutral-50 rounded-xl border space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-bold">Equity Bank Kenya</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-bold">1234567890123</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-bold">{loan.id}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-lg font-bold">
                    <FileUp className="w-5 h-5 mr-2" /> Upload Payment Proof
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  After making your payment, please upload a screenshot of the confirmation message or a PDF receipt. Our team will verify and update your status within 24 hours.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white border-2 border-dashed rounded-2xl space-y-4">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">All Caught Up!</h3>
                <p className="text-muted-foreground">You have no pending installments for this loan.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {loan.repaymentSchedule?.map((inst) => (
                <div key={inst.installmentNumber} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                      inst.status === 'paid' ? "bg-green-100 text-green-600" : "bg-neutral-100 text-neutral-500"
                    )}>
                      {inst.installmentNumber}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold">KSh {inst.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.status === 'paid' 
                          ? `Paid on ${format(new Date(inst.paidAt?.toString() || ''), 'PP')}`
                          : `Due on ${format(new Date(inst.dueDate.toString()), 'PP')}`
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={inst.status === 'paid' ? 'secondary' : 'outline'} className={cn(
                    inst.status === 'paid' && "bg-green-50 text-green-700 border-green-200",
                    inst.status === 'overdue' && "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {inst.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
