import { motion } from "motion/react";
import { useState } from "react";
import { AssessmentResult, BusinessProfile, LoanApplication, Currency } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  DollarSign, 
  ArrowUpRight, 
  History, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Calendar
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import LoanApplicationModal from "./LoanApplicationModal";
import RepaymentSchedule from "./RepaymentSchedule";
import PaymentView from "./PaymentView";
import GuarantorInvitation from "./GuarantorInvitation";
import { formatCurrency } from "../lib/currency";
import { formatDate } from "../lib/utils";
import { generateGrowthPlan } from "../services/gemini";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface DashboardProps {
  profile: BusinessProfile;
  assessment: AssessmentResult | null;
  allAssessments: AssessmentResult[];
  loans: LoanApplication[];
  onApplyLoan: (amount: number) => void;
  onReassess: () => void;
  onAppeal: (loanId: string) => void;
  currency: Currency;
}

export default function Dashboard({ profile, assessment, allAssessments, loans, onApplyLoan, onReassess, onAppeal, currency }: DashboardProps) {
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [growthPlan, setGrowthPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const financialData = [
    { name: 'Revenue', amount: profile.monthlyRevenue },
    { name: 'Expenses', amount: profile.monthlyExpenses },
    { name: 'Profit', amount: profile.monthlyRevenue - profile.monthlyExpenses },
  ];

  const handleGenerateGrowthPlan = async () => {
    if (!assessment) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateGrowthPlan(profile, assessment);
      setGrowthPlan(plan);
      toast.success("Growth plan generated!");
    } catch (error) {
      toast.error("Failed to generate growth plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const activeLoan = loans.find(l => l.status === 'approved' || l.status === 'disbursed');
  const selectedLoan = loans.find(l => l.id === selectedLoanId) || activeLoan;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">{profile.businessName}</h1>
          <p className="text-neutral-500 flex items-center gap-2 mt-1">
            <Badge variant="outline" className="uppercase">{profile.industry.replace("_", " ")}</Badge>
            • {profile.location}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onReassess}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-assess Business
          </Button>
          {assessment?.loanEligibility.eligible && !activeLoan && (
            <Button onClick={() => setIsLoanModalOpen(true)}>
              Apply for Loan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl shadow-primary/20">
              <CardHeader>
                <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Potential Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-6xl font-black">{assessment?.score || 0}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Platform Average: 64</span>
                    <span className="capitalize">{assessment?.potentialRating} Potential</span>
                  </div>
                  <Progress value={assessment?.score || 0} className="bg-white/20 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-neutral-500">Monthly Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-neutral-900">
                  {formatCurrency(profile.monthlyRevenue - profile.monthlyExpenses, currency)}
                </div>
                <div className="h-[60px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialData}>
                      <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI Business Analysis
                </CardTitle>
                <CardDescription>Generated by Gemini AI based on your profile</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGenerateGrowthPlan} disabled={isGeneratingPlan}>
                {isGeneratingPlan ? "Generating..." : "Generate Growth Plan"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-neutral-50 rounded-xl text-neutral-700 leading-relaxed text-sm">
                {assessment?.analysis}
              </div>
              
              {growthPlan && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-t pt-6"
                >
                  <h4 className="font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    90-Day Growth Roadmap
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg bg-blue-50/30">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Weeks 1-4</p>
                      <p className="text-xs font-semibold mb-2">{growthPlan.week1to4.focus}</p>
                      <ul className="text-[10px] space-y-1 text-muted-foreground">
                        {growthPlan.week1to4.actions.map((a: string, i: number) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50/30">
                      <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Weeks 5-8</p>
                      <p className="text-xs font-semibold mb-2">{growthPlan.week5to8.focus}</p>
                      <ul className="text-[10px] space-y-1 text-muted-foreground">
                        {growthPlan.week5to8.actions.map((a: string, i: number) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                    <div className="p-3 border rounded-lg bg-purple-50/30">
                      <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Weeks 9-12</p>
                      <p className="text-xs font-semibold mb-2">{growthPlan.week9to12.focus}</p>
                      <ul className="text-[10px] space-y-1 text-muted-foreground">
                        {growthPlan.week9to12.actions.map((a: string, i: number) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Key Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {assessment?.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    Growth Goals
                  </h4>
                  <p className="text-sm text-neutral-600 italic">
                    "{profile.goals}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Loan Eligibility */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Loan Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessment?.loanEligibility.eligible ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-500 uppercase font-bold">Max Eligible Amount</p>
                    <p className="text-3xl font-black text-primary">
                      {formatCurrency(assessment.loanEligibility.maxAmount, currency)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border">
                      <p className="text-[10px] text-neutral-500 uppercase">Interest Rate</p>
                      <p className="text-lg font-bold">{assessment.loanEligibility.interestRate}%</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border">
                      <p className="text-[10px] text-neutral-500 uppercase">Term</p>
                      <p className="text-lg font-bold">12 Months</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed italic">
                    "{assessment.loanEligibility.reasoning}"
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="destructive" className="mb-2">Not Eligible Yet</Badge>
                  <p className="text-sm text-neutral-600">
                    Follow the recommendations to improve your business potential score.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Loan / Repayment */}
          {selectedLoan && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                    <Badge className="uppercase">{selectedLoan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(selectedLoan.status === 'approved' || selectedLoan.status === 'disbursed') ? (
                    <PaymentView loan={selectedLoan} />
                  ) : selectedLoan.status === 'pending' ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                        <p className="text-sm text-amber-800">
                          Your application is currently being reviewed. You can increase your chances by inviting guarantors.
                        </p>
                      </div>
                      <GuarantorInvitation 
                        applicationId={selectedLoan.id} 
                        minGuarantors={1} 
                        onComplete={() => {}} 
                      />
                    </div>
                  ) : selectedLoan.status === 'rejected' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3">
                        <Target className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-red-900">Application Rejected</p>
                          <p className="text-xs text-red-800">
                            We couldn't approve your loan at this time. You can submit an appeal if you have additional information to share.
                          </p>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline" onClick={() => onAppeal(selectedLoan.id)}>
                        Appeal Decision
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loan History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4" />
                Loan History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {loans.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">No loan history</div>
                ) : (
                  loans.map(loan => (
                    <div 
                      key={loan.id} 
                      className={cn(
                        "p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors",
                        selectedLoanId === loan.id && "bg-primary/5 border-l-4 border-primary"
                      )}
                      onClick={() => setSelectedLoanId(loan.id)}
                    >
                      <div>
                        <p className="text-sm font-bold">{formatCurrency(loan.amount, currency)}</p>
                        <p className="text-[10px] text-neutral-500">{formatDate(loan.appliedAt, 'MMM d, yyyy')}</p>
                      </div>
                      <Badge variant={
                        loan.status === 'approved' || loan.status === 'disbursed' ? 'default' : 
                        loan.status === 'rejected' ? 'destructive' : 'secondary'
                      } className="text-[10px] uppercase">
                        {loan.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assessment History */}
      <Card className="border-none bg-neutral-100/50">
        <CardHeader className="cursor-pointer select-none" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4" />
              Assessment History
            </CardTitle>
            {isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {isHistoryOpen && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {allAssessments.map((asmt) => (
                <div key={asmt.id} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-primary">{asmt.score}</div>
                    <div>
                      <p className="text-sm font-semibold capitalize">{asmt.potentialRating} Potential</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(asmt.createdAt, 'PPp')}</p>
                    </div>
                  </div>
                  <Badge variant="outline">View Details</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <LoanApplicationModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
        onApply={onApplyLoan}
        maxAmount={assessment?.loanEligibility.maxAmount || 0}
        currency={currency}
      />
    </div>
  );
}
