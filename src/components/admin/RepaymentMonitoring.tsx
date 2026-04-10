import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { LoanApplication } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Ban, 
  Bell,
  ChevronRight,
  Search
} from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { formatDate } from "../../lib/utils";
import RepaymentCalendar from "./RepaymentCalendar";
import { cn } from "../../lib/utils";
import { Input } from "../ui/input";

export default function RepaymentMonitoring() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "loans"), where("status", "in", ["disbursed", "repaid"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication)));
    });
    return () => unsubscribe();
  }, []);

  const atRiskLoans = loans.filter(l => {
    const schedule = l.repaymentSchedule || [];
    return schedule.some(i => i.status === 'overdue');
  });

  const stats = {
    onTrack: loans.filter(l => l.status === 'disbursed' && !(l.repaymentSchedule || []).some(i => i.status === 'overdue')).length,
    atRisk: atRiskLoans.length,
    defaulted: atRiskLoans.filter(l => (l.repaymentSchedule || []).filter(i => i.status === 'overdue').length >= 3).length,
    completed: loans.filter(l => l.status === 'repaid').length
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Repayment Monitoring</h2>
        <p className="text-muted-foreground">Track active loans and manage collection risks.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-green-600">{stats.onTrack}</div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-amber-600">{stats.atRisk}</div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Defaulted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-red-600">{stats.defaulted}</div>
              <Ban className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-primary">{stats.completed}</div>
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* At Risk Table */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">At-Risk Loans</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input 
                placeholder="Search businesses..." 
                className="pl-7 h-8 text-xs bg-neutral-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRiskLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic text-sm">
                      No loans currently at risk.
                    </TableCell>
                  </TableRow>
                ) : (
                  atRiskLoans.map((loan) => {
                    const overdueCount = (loan.repaymentSchedule || []).filter(i => i.status === 'overdue').length;
                    const overdueAmount = (loan.repaymentSchedule || []).filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="font-bold text-sm">{loan.businessId}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{loan.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px] h-5">
                            {overdueCount} Missed
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {formatCurrency(overdueAmount, 'KES')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Repayment Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <RepaymentCalendar loans={loans} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
