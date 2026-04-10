import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { UserProfile, BusinessProfile, LoanApplication, AuditLog } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  X, 
  User as UserIcon, 
  Building2, 
  FileText, 
  History, 
  Shield, 
  Ban, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import { formatCurrency } from "../../lib/currency";
import { cn } from "../../lib/utils";
import { auditLogService } from "../../services/auditLog";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface UserDetailDrawerProps {
  userId: string;
  onClose: () => void;
}

export default function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return;
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        setUser(userData);

        const [bizSnap, loanSnap, auditSnap] = await Promise.all([
          getDocs(query(collection(db, "businesses"), where("userId", "==", userId))),
          getDocs(query(collection(db, "loans"), where("userId", "==", userId))),
          getDocs(query(collection(db, "audit_logs"), where("targetId", "==", userId), where("targetType", "==", "user")))
        ]);

        setBusinesses(bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile)));
        setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoanApplication)));
        setAuditTrail(auditSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)).sort((a, b) => 
          new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
        ));

      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSuspend = async () => {
    if (!user || suspensionReason.length < 10) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        suspended: true,
        suspendedAt: serverTimestamp(),
        suspendedReason: suspensionReason
      });
      await auditLogService.writeAuditLog({
        action: 'user_suspended',
        targetId: userId,
        targetType: 'user',
        before: { suspended: false },
        after: { suspended: true },
        reason: suspensionReason
      });
      setUser({ ...user, suspended: true });
      setIsSuspendDialogOpen(false);
      toast.success("User suspended");
    } catch (error) {
      toast.error("Failed to suspend user");
    }
  };

  const handleReinstate = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        suspended: false,
        suspendedAt: null,
        suspendedReason: null
      });
      await auditLogService.writeAuditLog({
        action: 'user_reinstated',
        targetId: userId,
        targetType: 'user',
        before: { suspended: true },
        after: { suspended: false }
      });
      setUser({ ...user, suspended: false });
      toast.success("User reinstated");
    } catch (error) {
      toast.error("Failed to reinstate user");
    }
  };

  const handlePromote = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", userId), { role: 'admin' });
      await auditLogService.writeAuditLog({
        action: 'user_role_promoted',
        targetId: userId,
        targetType: 'user',
        before: { role: 'user' },
        after: { role: 'admin' }
      });
      setUser({ ...user, role: 'admin' });
      setIsPromoteDialogOpen(false);
      toast.success("User promoted to admin");
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  if (isLoading) return null;
  if (!user) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[60] flex flex-col border-l animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className={user.role === 'admin' ? "bg-orange-500" : ""}>
                {user.role}
              </Badge>
              {user.suspended && <Badge variant="destructive">Suspended</Badge>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex-grow flex flex-col">
        <div className="px-6 border-b">
          <TabsList className="w-full justify-start h-12 bg-transparent gap-6 p-0">
            <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="businesses" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <Building2 className="h-4 w-4 mr-2" />
              Businesses
            </TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <FileText className="h-4 w-4 mr-2" />
              Loans
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 bg-transparent shadow-none">
              <History className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <TabsContent value="profile" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Phone</p>
                  <p className="text-sm font-medium">{user.phone || "Not provided"}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Joined</p>
                  <p className="text-sm font-medium">{formatDate(user.createdAt, 'PP')}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Last Login</p>
                  <p className="text-sm font-medium">{formatDate(user.lastLoginAt, 'PPp')}</p>
                </div>
              </div>

              {user.suspended && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <Ban className="h-4 w-4" />
                    Suspension Details
                  </div>
                  <p className="text-xs text-red-600 italic">"{user.suspendedReason}"</p>
                  <p className="text-[10px] text-red-500 uppercase font-bold">
                    Suspended on {formatDate(user.suspendedAt, 'PP')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Admin Actions
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {user.role === 'user' && (
                  <Button variant="outline" className="justify-start" onClick={() => setIsPromoteDialogOpen(true)}>
                    <Shield className="h-4 w-4 mr-2 text-orange-500" />
                    Promote to Admin
                  </Button>
                )}
                {user.suspended ? (
                  <Button variant="outline" className="justify-start text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleReinstate}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Reinstate Account
                  </Button>
                ) : (
                  <Button variant="outline" className="justify-start text-destructive hover:bg-destructive/5" onClick={() => setIsSuspendDialogOpen(true)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                )}
                <Button variant="outline" className="justify-start text-destructive hover:bg-destructive/5">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="businesses" className="mt-0 space-y-4">
            {businesses.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground italic text-sm">No businesses registered.</p>
            ) : (
              businesses.map((biz) => (
                <div key={biz.id} className="p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="font-bold">{biz.businessName}</p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{biz.industry.replace("_", " ")}</span>
                    <span>Created {formatDate(biz.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="loans" className="mt-0 space-y-4">
            {loans.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground italic text-sm">No loan applications.</p>
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-primary">{formatCurrency(loan.amount, 'KES')}</p>
                    <Badge variant="outline" className="capitalize">{loan.status}</Badge>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Applied {formatDate(loan.appliedAt, 'MMM d, yyyy')}</span>
                    <span className="font-mono">{loan.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-0 space-y-4">
            {auditTrail.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground italic text-sm">No administrative activity recorded.</p>
            ) : (
              auditTrail.map((log) => (
                <div key={log.id} className="p-3 bg-neutral-50 rounded-lg border space-y-1">
                  <p className="text-xs font-bold capitalize">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-muted-foreground">By {log.adminEmail}</p>
                  <p className="text-[10px] text-neutral-400">{formatDate(log.createdAt, 'PPp')}</p>
                </div>
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              The user will be blocked from submitting assessments and loan applications.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason for suspension (min 10 characters)..." 
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSuspendDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={suspensionReason.length < 10}>
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Admin</DialogTitle>
            <DialogDescription>
              This will grant the user full administrative access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePromote}>Confirm Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
