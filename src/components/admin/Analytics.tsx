import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { LoanApplication, BusinessProfile, AssessmentResult } from "../../types";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { formatCurrency } from "../../lib/currency";

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

export default function Analytics() {
  const [loanData, setLoanData] = useState<LoanApplication[]>([]);
  const [businessData, setBusinessData] = useState<BusinessProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [loanSnap, bizSnap] = await Promise.all([
          getDocs(collection(db, "loans")),
          getDocs(collection(db, "businesses"))
        ]);
        setLoanData(loanSnap.docs.map(d => d.data() as LoanApplication));
        setBusinessData(bizSnap.docs.map(d => d.data() as BusinessProfile));
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for charts
  const statusData = [
    { name: 'Pending', value: loanData.filter(l => l.status === 'pending').length },
    { name: 'Approved', value: loanData.filter(l => l.status === 'approved').length },
    { name: 'Disbursed', value: loanData.filter(l => l.status === 'disbursed').length },
    { name: 'Repaid', value: loanData.filter(l => l.status === 'repaid').length },
    { name: 'Rejected', value: loanData.filter(l => l.status === 'rejected').length },
    { name: 'Written Off', value: loanData.filter(l => l.status === 'written_off').length },
  ].filter(d => d.value > 0);

  const industryData = businessData.reduce((acc: any[], biz) => {
    const existing = acc.find(a => a.name === biz.industry);
    if (existing) existing.value += 1;
    else acc.push({ name: biz.industry, value: 1 });
    return acc;
  }, []).map(d => ({ ...d, name: d.name.replace("_", " ").toUpperCase() }));

  if (isLoading) return <div className="p-12 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence</h2>
          <p className="text-muted-foreground">Visual insights into platform performance and trends.</p>
        </div>
        <Button variant="outline" className="bg-white">
          <Download className="h-4 w-4 mr-2" />
          Download Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan Status Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Loan Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Businesses by Industry</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Disbursement Volume */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Disbursement Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jan', amount: 450000 },
                { month: 'Feb', amount: 520000 },
                { month: 'Mar', amount: 480000 },
                { month: 'Apr', amount: 610000 },
                { month: 'May', amount: 750000 },
                { month: 'Jun', amount: 890000 },
              ]}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(val) => `KSh ${val/1000}k`} />
                <Tooltip formatter={(val) => formatCurrency(Number(val), 'KES')} />
                <Area type="monotone" dataKey="amount" stroke="#f97316" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
