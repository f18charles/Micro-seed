import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AssessmentForm from "./components/AssessmentForm";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";
import AdminDashboard from "./components/admin/AdminDashboard";
import GuarantorConsent from "./components/GuarantorConsent";
import AppealForm from "./components/AppealForm";
import NotFoundPage from "./components/NotFoundPage";
import NotificationBell from "./components/NotificationBell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardSkeleton } from "./components/LoadingSkeletons";
import BusinessSelector from "./components/BusinessSelector";
import { BusinessProfile, AssessmentResult, LoanApplication, UserProfile, Currency, GlobalSettings } from "./types";
import { assessBusinessPotential } from "./services/gemini";
import { runFraudCheck } from "./services/fraudDetection";
import { buildFinancialEvidenceSummary } from "./services/financialEvidence";
import { notificationService } from "./services/notifications";
import { Toaster, toast } from "sonner";
import { LogIn, LogOut, User as UserIcon, Loader2, ShieldCheck, LayoutDashboard, UserCircle, Ban } from "lucide-react";
import { Button } from "./components/ui/button";
import { auth, db, googleProvider, OperationType, handleFirestoreError, serverTimestamp } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc } from "firebase/firestore";
import { checkAuthGuard } from "./lib/guards";
import { useInactivityLogout } from "./lib/useInactivityLogout";
import { checkRateLimit, recordAttempt } from "./lib/rateLimiter";
import { CURRENCY_CONFIG } from "./lib/currency";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./components/ui/dropdown-menu";

type View = 'landing' | 'assessment' | 'dashboard' | 'profile' | 'admin' | 'not_found' | 'guarantor_consent' | 'appeal';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);

  // Check for guarantor token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setView('guarantor_consent');
    }
  }, []);

  // Inactivity Logout
  useInactivityLogout(30 * 60 * 1000);

  // Maintenance Mode & Global Settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "app_settings", "global"), (snap) => {
      if (snap.exists()) {
        setGlobalSettings(snap.data() as GlobalSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'app_settings/global'));
    
    const handleExitAdmin = () => setView('dashboard');
    window.addEventListener('exit-admin', handleExitAdmin);
    
    return () => {
      unsubSettings();
      window.removeEventListener('exit-admin', handleExitAdmin);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUser(userData);
          await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        } else {
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            role: 'user',
            createdAt: serverTimestamp() as any,
            lastLoginAt: serverTimestamp() as any,
            currency: 'KES',
            suspended: false,
            totalLoans: 0,
            totalDisbursed: 0
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
        setBusinesses([]);
        setActiveBusinessId(null);
        setAssessments([]);
        setLoans([]);
        setView('landing');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Maintenance Check
  const isMaintenanceActive = globalSettings?.maintenanceMode && user?.role !== 'admin';

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const businessesQuery = query(collection(db, 'businesses'), where('userId', '==', user.uid));
    const unsubBusinesses = onSnapshot(businessesQuery, (snapshot) => {
      const bizData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
      setBusinesses(bizData);
      
      if (bizData.length > 0 && !activeBusinessId) {
        setActiveBusinessId(bizData[0].id);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));

    return () => unsubBusinesses();
  }, [user]);

  useEffect(() => {
    if (!user || !activeBusinessId) return;

    const assessmentsQuery = query(
      collection(db, 'assessments'), 
      where('businessId', '==', activeBusinessId),
      orderBy('createdAt', 'desc')
    );
    const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
      const asmtData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentResult));
      setAssessments(asmtData);
      if (view === 'landing' || view === 'assessment') setView('dashboard');
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    const loansQuery = query(
      collection(db, 'loans'), 
      where('businessId', '==', activeBusinessId), 
      orderBy('appliedAt', 'desc')
    );
    const unsubLoans = onSnapshot(loansQuery, (snapshot) => {
      const loansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication));
      setLoans(loansData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'loans'));

    return () => {
      unsubAssessments();
      unsubLoans();
    };
  }, [user, activeBusinessId]);

  // View Guard
  useEffect(() => {
    const guard = checkAuthGuard(user, view);
    if (!guard.allowed) {
      if (user) toast.error(guard.reason);
      setView('landing');
    }
  }, [view, user]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isMaintenanceActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-orange-900 uppercase tracking-tight">Maintenance Mode</h1>
          <p className="text-orange-800 leading-relaxed font-medium">
            {globalSettings?.maintenanceMessage}
          </p>
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    );
  }

  if (user?.suspended && view !== 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Ban className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-red-900 uppercase tracking-tight">Account Suspended</h1>
          <p className="text-red-800 leading-relaxed font-medium">
            Your account has been suspended. Please contact {globalSettings?.supportEmail || 'support@microseed.com'} for assistance.
          </p>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'admin' && user?.role === 'admin') {
    return <AdminDashboard />;
  }

  const activeBusiness = businesses.find(b => b.id === activeBusinessId) || null;
  const currencySymbol = CURRENCY_CONFIG[user?.currency || 'KES'].symbol;

  const handleLogin = async () => {
    if (!checkRateLimit('login', 5, 10 * 60 * 1000)) {
      toast.error("Too many login attempts. Please wait.");
      return;
    }
    recordAttempt('login');
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login");
    }
  };

  const handleAssessmentSubmit = async (values: any) => {
    if (!user) return;
    if (!checkRateLimit('assessment', 3, 60 * 60 * 1000)) {
      toast.error("You've submitted too many assessments. Please wait an hour.");
      return;
    }
    recordAttempt('assessment');
    
    setIsLoading(true);
    try {
      const bizId = activeBusinessId && view === 'dashboard' ? activeBusinessId : 'biz_' + Date.now();
      const assessmentId = 'asmt_' + Date.now();
      const newProfile: BusinessProfile = {
        ...values,
        id: bizId,
        userId: user.uid,
        createdAt: serverTimestamp() as any,
      };
      
      // 1. Basic AI Assessment
      const result = await assessBusinessPotential(newProfile);
      
      // 2. Financial Evidence Analysis (if documents provided)
      let evidenceSummary = null;
      if (values.documents && values.documents.length > 0) {
        evidenceSummary = await buildFinancialEvidenceSummary(assessmentId, bizId, values.documents);
        
        // Adjust score based on evidence
        if (evidenceSummary.trend === 'growing') result.score += 5;
        if (evidenceSummary.trend === 'declining') result.score -= 10;
        
        // Check for revenue deviation
        const claimedRevenue = values.monthlyRevenue;
        const actualRevenue = evidenceSummary.averageMonthlyRevenue;
        const deviation = Math.abs((claimedRevenue - actualRevenue) / claimedRevenue) * 100;
        
        if (deviation > 20) {
          result.score -= 15;
          result.recommendations.push("Your documented revenue significantly differs from your stated revenue. Please verify your records.");
        } else {
          result.score += 5; // Bonus for accurate records
        }
      }

      const assessmentResult: AssessmentResult = {
        ...result,
        id: assessmentId,
        businessId: bizId,
        createdAt: serverTimestamp() as any,
        financialEvidenceId: evidenceSummary?.id
      };

      if (!activeBusinessId || view !== 'dashboard') {
        await setDoc(doc(db, 'businesses', bizId), newProfile);
      } else {
        await updateDoc(doc(db, 'businesses', bizId), values);
      }
      
      await setDoc(doc(db, 'assessments', assessmentId), assessmentResult);
      
      // 3. Fraud Check (AI Analysis of documents)
      if (values.documents && values.documents.length > 0 && evidenceSummary) {
        const fraudResult = await runFraudCheck(assessmentId, newProfile, values.documents, evidenceSummary.monthlyRecords);
        await setDoc(doc(db, 'fraud_checks', 'fraud_' + assessmentId), fraudResult);
        
        if (fraudResult.overallRisk === 'high' || fraudResult.overallRisk === 'critical') {
          // Flag assessment
          await updateDoc(doc(db, 'assessments', assessmentId), { flagged: true, fraudRisk: fraudResult.overallRisk });
        }
      }

      await notificationService.sendAssessmentComplete(user.uid, newProfile.businessName, assessmentResult.score);

      setActiveBusinessId(bizId);
      setView('dashboard');
      toast.success("Assessment complete!");
    } catch (error) {
      console.error("Assessment error:", error);
      toast.error("Failed to analyze business. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLoan = async (amount: number) => {
    if (!user || !activeBusinessId || assessments.length === 0) return;
    if (!checkRateLimit('loan_application', 2, 24 * 60 * 60 * 1000)) {
      toast.error("Too many loan applications. Please wait 24 hours.");
      return;
    }
    recordAttempt('loan_application');
    
    try {
      const loanId = 'loan_' + Date.now();
      const newLoan: LoanApplication = {
        id: loanId,
        userId: user.uid,
        businessId: activeBusinessId,
        amount: amount,
        status: 'pending',
        appliedAt: serverTimestamp() as any,
        assessmentId: assessments[0].id,
      };

      await setDoc(doc(db, 'loans', loanId), newLoan);
      toast.success("Loan application submitted!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'loans');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
                <div className="bg-primary p-1.5 rounded-lg">
                  <div className="w-5 h-5 bg-white rounded-sm" />
                </div>
                <span className="text-xl font-bold tracking-tight">MicroSeed</span>
              </div>

              {user && businesses.length > 0 && (
                <div className="hidden md:block">
                  <BusinessSelector 
                    businesses={businesses} 
                    activeId={activeBusinessId} 
                    onSelect={setActiveBusinessId} 
                    onAddNew={() => setView('assessment')}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <NotificationBell />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} referrerPolicy="no-referrer" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate w-[180px]">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setView('dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setView('profile')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      {user.role === 'admin' && (
                        <DropdownMenuItem onClick={() => setView('admin')} className="text-primary font-bold">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={handleLogin}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <ErrorBoundary>
          {isLoading && view === 'dashboard' ? (
            <DashboardSkeleton />
          ) : (
            <>
              {view === 'landing' && <LandingPage onStart={() => setView(user ? (businesses.length > 0 ? 'dashboard' : 'assessment') : 'landing')} />}
              {view === 'assessment' && (
                <AssessmentForm 
                  onSubmit={handleAssessmentSubmit} 
                  isLoading={isLoading} 
                  currencySymbol={currencySymbol}
                  initialData={activeBusiness || undefined}
                />
              )}
              {view === 'dashboard' && activeBusiness && (
                <Dashboard 
                  profile={activeBusiness} 
                  assessment={assessments[0] || null} 
                  allAssessments={assessments}
                  loans={loans} 
                  onApplyLoan={handleApplyLoan} 
                  onReassess={() => setView('assessment')}
                  onAppeal={(loanId) => { setActiveLoanId(loanId); setView('appeal'); }}
                  currency={user?.currency || 'KES'}
                />
              )}
              {view === 'profile' && user && (
                <ProfilePage 
                  user={user} 
                  businesses={businesses} 
                  onViewDashboard={(id) => { setActiveBusinessId(id); setView('dashboard'); }} 
                />
              )}
              {view === 'admin' && <AdminDashboard />}
              {view === 'guarantor_consent' && <GuarantorConsent />}
              {view === 'appeal' && loans.find(l => l.id === activeLoanId) && (
                <AppealForm 
                  loan={loans.find(l => l.id === activeLoanId)!} 
                  onComplete={() => setView('dashboard')} 
                />
              )}
              {view === 'not_found' && <NotFoundPage onGoHome={() => setView('landing')} />}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-500 text-sm">
          <p>© 2026 MicroSeed Finance. All rights reserved.</p>
          <p className="mt-2 italic">Empowering small businesses through AI-driven insights.</p>
        </div>
      </footer>
    </div>
  );
}
