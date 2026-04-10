import { LoanApplication, Currency } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { formatCurrency } from "../lib/currency";
import { formatDate } from "../lib/utils";
import { CheckCircle2, AlertCircle, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface RepaymentScheduleProps {
  loan: LoanApplication;
  currency: Currency;
}

export default function RepaymentSchedule({ loan, currency }: RepaymentScheduleProps) {
  if (!loan.repaymentSchedule) return null;

  const totalPaid = loan.repaymentSchedule
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const totalAmount = loan.repaymentSchedule.reduce((sum, i) => sum + i.amount, 0);
  const progress = (totalPaid / totalAmount) * 100;
  const nextDue = loan.repaymentSchedule.find(i => i.status !== 'paid');

  const handleMarkAsPaid = async (installmentNumber: number) => {
    const updatedSchedule = loan.repaymentSchedule?.map(i => {
      if (i.installmentNumber === installmentNumber) {
        return { ...i, status: 'paid' as const, paidAt: new Date().toISOString() };
      }
      return i;
    });

    try {
      await updateDoc(doc(db, "loans", loan.id), {
        repaymentSchedule: updatedSchedule,
        status: updatedSchedule?.every(i => i.status === 'paid') ? 'repaid' : loan.status
      });
      toast.success(`Installment #${installmentNumber} marked as paid`);
    } catch (error) {
      toast.error("Failed to update repayment status");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-neutral-50/50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Repayment Schedule
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {loan.repaymentSchedule.length} INSTALLMENTS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 bg-primary/5 border-b space-y-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Repayment Progress</span>
            <span className="font-medium">{Math.round(progress)}% Paid</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Remaining</p>
              <p className="text-lg font-bold">{formatCurrency(totalAmount - totalPaid, currency)}</p>
            </div>
          </div>
          {nextDue && (
            <div className="bg-white p-3 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ArrowUpRight className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Due Date</p>
                  <p className="text-sm font-semibold">{formatDate(nextDue.dueDate, 'PPP')}</p>
                </div>
              </div>
              <p className="text-sm font-bold">{formatCurrency(nextDue.amount, currency)}</p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Principal</TableHead>
                <TableHead className="hidden sm:table-cell">Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.repaymentSchedule.map((item) => (
                <TableRow key={item.installmentNumber} className={item.status === 'overdue' ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">#{item.installmentNumber}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(item.dueDate, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(item.amount, currency)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {formatCurrency(item.principal, currency)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {formatCurrency(item.interest, currency)}
                  </TableCell>
                  <TableCell>
                    {item.status === 'paid' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Paid
                      </Badge>
                    ) : item.status === 'overdue' ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Upcoming
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status !== 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleMarkAsPaid(item.installmentNumber)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
