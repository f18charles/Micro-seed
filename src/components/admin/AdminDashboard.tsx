import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, getDocs, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { AdminStats, LoanApplication, UserProfile } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Users, FileText, CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import LoanReviewTable from "./LoanReviewTable";
import UserManagementTable from "./UserManagementTable";
import AnalyticsCharts from "./AnalyticsCharts";
import { formatCurrency } from "../../lib/currency";
import { AdminTableSkeleton } from "../LoadingSkeletons";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalLoans: 0,
    pendingLoans: 0,
    approvedLoans: 0,
    totalDisbursed: 0,
    totalRepaid: 0,
    defaultRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Real-time stats listener
    const unsubLoans = onSnapshot(collection(db, "loans"), (snapshot) => {
      const loans = snapshot.docs.map(doc => doc.data() as LoanApplication);
      
      const pending = loans.filter(l => l.status === 'pending').length;
      const approved = loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length;
      const disbursed = loans.filter(l => l.status === 'disbursed' || l.status === 'repaid').reduce((sum, l) => sum + l.amount, 0);
      const repaid = loans.filter(l => l.status === 'repaid').reduce((sum, l) => sum + l.amount, 0);
      
      setStats(prev => ({
        ...prev,
        totalLoans: loans.length,
        pendingLoans: pending,
        approvedLoans: approved,
        totalDisbursed: disbursed,
        totalRepaid: repaid,
      }));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });

    const unsubBiz = onSnapshot(collection(db, "businesses"), (snapshot) => {
      setStats(prev => ({ ...prev, totalBusinesses: snapshot.size }));
      setIsLoading(false);
    });

    return () => {
      unsubLoans();
      unsubUsers();
      unsubBiz();
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, description, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) return <AdminTableSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>
        <p className="text-muted-foreground">Monitor platform performance and review loan applications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          description="Registered business owners"
          color="text-blue-600"
        />
        <StatCard 
          title="Pending Loans" 
          value={stats.pendingLoans} 
          icon={Clock} 
          description="Awaiting review"
          color="text-amber-600"
        />
        <StatCard 
          title="Total Disbursed" 
          value={formatCurrency(stats.totalDisbursed, 'KES')} 
          icon={DollarSign} 
          description="Active capital in market"
          color="text-green-600"
        />
        <StatCard 
          title="Repayment Rate" 
          value="98.2%" 
          icon={TrendingUp} 
          description="Platform health score"
          color="text-primary"
        />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="all-loans">All Loans</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="pending">
            <LoanReviewTable filter="pending" />
          </TabsContent>
          <TabsContent value="all-loans">
            <LoanReviewTable filter="all" />
          </TabsContent>
          <TabsContent value="users">
            <UserManagementTable />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsCharts />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
