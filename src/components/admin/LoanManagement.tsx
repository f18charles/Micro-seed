import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, onSnapshot, orderBy, where } from "firebase/firestore";
import { LoanApplication, BusinessProfile, AssessmentResult } from "../../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { formatCurrency } from "../../lib/currency";
import { formatDate } from "../../lib/utils";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Ban
} from "lucide-react";
import LoanDetailDrawer from "./LoanDetailDrawer";
import { cn } from "../../lib/utils";

type ViewMode = 'pipeline' | 'table';

export default function LoanManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "loans"), orderBy("appliedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication)));
    });
    return () => unsubscribe();
  }, []);

  const filteredLoans = loans.filter(l => 
    l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.businessId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Loan ID", "User ID", "Business ID", "Amount", "Status", "Applied At", "Assessment ID"];
    const rows = filteredLoans.map(l => [
      l.id,
      l.userId,
      l.businessId,
      l.amount,
      l.status,
      formatDate(l.appliedAt, 'yyyy-MM-dd HH:mm'),
      l.assessmentId
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `microseed-loans-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Loan Management</h2>
          <p className="text-muted-foreground">Manage the full lifecycle of loan applications.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <Button 
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('pipeline')}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Pipeline
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('table')}
            className="h-8"
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID or Business..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="bg-white" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
          <PipelineColumn title="Pending" status="pending" loans={filteredLoans} onSelect={setSelectedLoanId} icon={Clock} color="text-amber-500" />
          <PipelineColumn title="Approved" status="approved" loans={filteredLoans} onSelect={setSelectedLoanId} icon={CheckCircle2} color="text-blue-500" />
          <PipelineColumn title="Disbursed" status="disbursed" loans={filteredLoans} onSelect={setSelectedLoanId} icon={Banknote} color="text-green-500" />
          <PipelineColumn title="Repaid" status="repaid" loans={filteredLoans} onSelect={setSelectedLoanId} icon={CheckCircle2} color="text-emerald-500" />
          <PipelineColumn title="Rejected" status="rejected" loans={filteredLoans} onSelect={setSelectedLoanId} icon={XCircle} color="text-destructive" />
          <PipelineColumn title="Written Off" status="written_off" loans={filteredLoans} onSelect={setSelectedLoanId} icon={Ban} color="text-neutral-500" />
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Business ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    No loans found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setSelectedLoanId(loan.id)}>
                    <TableCell className="font-mono text-xs">{loan.id.slice(0, 12)}...</TableCell>
                    <TableCell className="font-medium">{loan.businessId}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(loan.amount, 'KES')}</TableCell>
                    <TableCell>
                      <StatusBadge status={loan.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(loan.appliedAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedLoanId && (
        <LoanDetailDrawer 
          loanId={selectedLoanId} 
          onClose={() => setSelectedLoanId(null)} 
        />
      )}
    </div>
  );
}

function PipelineColumn({ title, status, loans, onSelect, icon: Icon, color }: any) {
  const columnLoans = loans.filter((l: any) => l.status === status);
  
  return (
    <div className="flex-shrink-0 w-80 flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <Badge variant="secondary" className="bg-white border">{columnLoans.length}</Badge>
      </div>
      
      <div className="flex-grow space-y-3 p-2 bg-neutral-100/50 rounded-xl border-2 border-dashed border-neutral-200">
        {columnLoans.map((loan: any) => (
          <div 
            key={loan.id} 
            className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
            onClick={() => onSelect(loan.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-muted-foreground">{loan.id.slice(0, 8)}</span>
              {loan.riskFlag && (
                <Badge variant="outline" className={cn(
                  "text-[8px] h-4 px-1 uppercase",
                  loan.riskFlag === 'high' ? "border-red-200 text-red-600 bg-red-50" :
                  loan.riskFlag === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" :
                  "border-green-200 text-green-600 bg-green-50"
                )}>
                  {loan.riskFlag} Risk
                </Badge>
              )}
            </div>
            <p className="font-bold text-sm mb-1 line-clamp-1">{loan.businessId}</p>
            <p className="text-lg font-black text-primary mb-3">{formatCurrency(loan.amount, 'KES')}</p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{formatDate(loan.appliedAt, 'MMM d')}</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        {columnLoans.length === 0 && (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground italic">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-blue-100 text-blue-700 border-blue-200",
    disbursed: "bg-green-100 text-green-700 border-green-200",
    repaid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    written_off: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
  
  return (
    <Badge variant="outline" className={cn("capitalize border", variants[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function Banknote(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
