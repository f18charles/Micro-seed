import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LoanApplication, BusinessProfile } from "../../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function AnalyticsCharts() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);

  useEffect(() => {
    const unsubLoans = onSnapshot(collection(db, "loans"), (snapshot) => {
      setLoans(snapshot.docs.map(d => d.data() as LoanApplication));
    });
    const unsubBiz = onSnapshot(collection(db, "businesses"), (snapshot) => {
      setBusinesses(snapshot.docs.map(d => d.data() as BusinessProfile));
    });
    return () => { unsubLoans(); unsubBiz(); };
  }, []);

  // Industry Breakdown
  const industryData = businesses.reduce((acc: any[], biz) => {
    const existing = acc.find(i => i.name === biz.industry);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: biz.industry, value: 1 });
    }
    return acc;
  }, []);

  // Loan Status Breakdown
  const statusData = loans.reduce((acc: any[], loan) => {
    const existing = acc.find(i => i.name === loan.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: loan.status, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Businesses by Industry</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={industryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loan Status Distribution</CardTitle>
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
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
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
    </div>
  );
}
