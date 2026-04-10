import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from "firebase/firestore";
import { AuditLog, LoanApplication, UserProfile, BusinessProfile } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  Users, 
  Building2, 
  FileText, 
  Banknote, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { formatDate, cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";

export default function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBusinesses: 0,
    pendingLoans: 0,
    totalDisbursed: 0,
    repaymentRate: 0,
    defaultRate: 0
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Real-time stats
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => setStats(prev => ({ ...prev, totalUsers: s.size })));
    const unsubBiz = onSnapshot(collection(db, "businesses"), (s) => setStats(prev => ({ ...prev, activeBusinesses: s.size })));
    const unsubLoans = onSnapshot(collection(db, "loans"), (s) => {
      const loans = s.docs.map(d => d.data() as LoanApplication);
      const pending = loans.filter(l => l.status === 'pending').length;
      const disbursed = loans.filter(l => l.status === 'disbursed' || l.status === 'repaid').reduce((sum, l) => sum + l.amount, 0);
      
      // Calculate repayment rate (simplified)
      const allInstalments = loans.flatMap(l => l.repaymentSchedule || []);
      const paid = allInstalments.filter(i => i.status === 'paid').length;
      const totalDue = allInstalments.filter(i => i.status !== 'upcoming').length;
      const rate = totalDue > 0 ? (paid / totalDue) * 100 : 0;

      setStats(prev => ({ 
        ...prev, 
        pendingLoans: pending, 
        totalDisbursed: disbursed,
        repaymentRate: rate
      }));
    });

    // Recent Audit Logs
    const logsQuery = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(20));
    const unsubLogs = onSnapshot(logsQuery, (s) => {
      setRecentLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    });

    // Alerts
    const pendingOldQuery = query(collection(db, "loans"), where("status", "==", "pending"));
    const unsubAlerts = onSnapshot(pendingOldQuery, (s) => {
      const now = Date.now();
      const oldLoans = s.docs.filter(d => {
        const appliedAt = (d.data().appliedAt as any)?.toDate?.() || new Date(d.data().appliedAt);
        return now - appliedAt.getTime() > 48 * 60 * 60 * 1000;
      });
      setAlerts(oldLoans.map(d => ({ id: d.id, type: 'pending_old', data: d.data() })));
    });

    return () => {
      unsubUsers();
      unsubBiz();
      unsubLoans();
      unsubLogs();
      unsubAlerts();
    };
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, trend: "+12%", up: true, icon: Users },
    { label: "Active Businesses", value: stats.activeBusinesses, trend: "+5%", up: true, icon: Building2 },
    { label: "Pending Loans", value: stats.pendingLoans, trend: "Neutral", up: null, icon: FileText },
    { label: "Total Disbursed", value: formatCurrency(stats.totalDisbursed, 'KES'), trend: "+18%", up: true, icon: Banknote },
    { label: "Repayment Rate", value: `${stats.repaymentRate.toFixed(1)}%`, trend: "+2%", up: true, icon: TrendingUp },
    { label: "Default Rate", value: `${stats.defaultRate.toFixed(1)}%`, trend: "-1%", up: true, icon: AlertCircle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
        <p className="text-muted-foreground">Real-time snapshot of MicroSeed performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center mt-1">
                {card.up !== null && (
                  <span className={cn(
                    "text-xs flex items-center font-medium mr-1",
                    card.up ? "text-green-600" : "text-red-600"
                  )}>
                    {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm italic">No recent activity logged.</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-neutral-100 text-xs font-bold">
                        {log.adminEmail.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow space-y-1">
                      <p className="text-sm leading-tight">
                        <span className="font-bold">{log.adminEmail}</span>
                        {" "}
                        <span className="text-neutral-600">{log.action.replace(/_/g, " ")}</span>
                        {" "}
                        <span className="text-neutral-400">ID: {log.targetId.slice(0, 8)}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {formatDate(log.createdAt, 'PPp')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  All clear! No urgent alerts.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-orange-900">Pending Loan &gt; 48h</p>
                      <p className="text-[10px] text-orange-700">
                        {alert.data.businessId} applied for {formatCurrency(alert.data.amount, 'KES')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
