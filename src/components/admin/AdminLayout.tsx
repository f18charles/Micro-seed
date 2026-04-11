import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  CalendarClock, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  ShieldAlert,
  FileSearch,
  Settings2,
  CreditCard
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

export type AdminTab = 'overview' | 'loans' | 'users' | 'analytics' | 'repayments' | 'settings' | 'documents' | 'lender_config' | 'payments';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExit: () => void;
  pendingLoansCount?: number;
  pendingDocsCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ 
  activeTab, 
  onTabChange, 
  onExit, 
  pendingLoansCount = 0,
  pendingDocsCount = 0,
  children 
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'loans', label: 'Loans', icon: FileText, badge: pendingLoansCount },
    { id: 'documents', label: 'Doc Review', icon: FileSearch, badge: pendingDocsCount },
    { id: 'payments', label: 'Payment Gateway', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'repayments', label: 'Repayments', icon: CalendarClock },
    { id: 'lender_config', label: 'Lender Config', icon: Settings2 },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button 
          size="icon" 
          className="rounded-full shadow-lg" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transition-transform lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600 bg-orange-50">
              ADMIN
            </Badge>
          </div>

          <nav className="flex-grow p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setIsSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  activeTab === item.id 
                    ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500 rounded-l-none pl-2" 
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "h-4 w-4",
                    activeTab === item.id ? "text-orange-500" : "text-neutral-400 group-hover:text-neutral-600"
                  )} />
                  {item.label}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="bg-orange-500 text-white border-none h-5 min-w-5 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-neutral-500 hover:text-neutral-900"
              onClick={onExit}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between lg:hidden">
           <span className="font-bold text-lg">MicroSeed Admin</span>
        </header>
        <div className="flex-grow p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
