import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AssessmentForm from "./components/AssessmentForm";
import Dashboard from "./components/Dashboard";
import { BusinessProfile, AssessmentResult, LoanApplication, UserProfile } from "./types";
import { assessBusinessPotential } from "./services/gemini";
import { Toaster, toast } from "sonner";
import { LogIn, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

type View = 'landing' | 'assessment' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            role: 'user'
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
        setProfile(null);
        setAssessment(null);
        setLoans([]);
        setView('landing');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const businessesQuery = query(collection(db, 'businesses'), where('userId', '==', user.uid));
    const unsubBusinesses = onSnapshot(businessesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const bizData = snapshot.docs[0].data() as BusinessProfile;
        setProfile(bizData);
        
        // Fetch assessment for this business
        const assessmentsQuery = query(collection(db, 'assessments'), where('businessId', '==', bizData.id));
        onSnapshot(assessmentsQuery, (asmtSnapshot) => {
          if (!asmtSnapshot.empty) {
            setAssessment(asmtSnapshot.docs[0].data() as AssessmentResult);
            if (view === 'landing' || view === 'assessment') setView('dashboard');
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));

    const loansQuery = query(collection(db, 'loans'), where('userId', '==', user.uid), orderBy('appliedAt', 'desc'));
    const unsubLoans = onSnapshot(loansQuery, (snapshot) => {
      const loansData = snapshot.docs.map(doc => doc.data() as LoanApplication);
      setLoans(loansData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'loans'));

    return () => {
      unsubBusinesses();
      unsubLoans();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleStart = () => {
    if (!user) {
      handleLogin();
    } else {
      setView(profile ? 'dashboard' : 'assessment');
    }
  };

  const handleAssessmentSubmit = async (values: any) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const bizId = 'biz_' + Date.now();
      const newProfile: BusinessProfile = {
        ...values,
        id: bizId,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      
      const result = await assessBusinessPotential(newProfile);
      
      const assessmentId = 'asmt_' + Date.now();
      const assessmentResult: AssessmentResult = {
        ...result,
        id: assessmentId,
        businessId: bizId,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      await setDoc(doc(db, 'businesses', bizId), newProfile);
      await setDoc(doc(db, 'assessments', assessmentId), assessmentResult);

      setProfile(newProfile);
      setAssessment(assessmentResult);
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
    if (!user || !profile || !assessment) return;
    
    try {
      const loanId = 'loan_' + Date.now();
      const newLoan: LoanApplication = {
        id: loanId,
        userId: user.uid,
        businessId: profile.id,
        amount: amount,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        assessmentId: assessment.id,
      };

      await setDoc(doc(db, 'loans', loanId), newLoan);
      toast.success("Loan application submitted!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'loans');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster position="top-center" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
              <div className="bg-primary p-1.5 rounded-lg">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <span className="text-xl font-bold tracking-tight">MicroSeed</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-600">
                    <UserIcon className="h-4 w-4" />
                    {user.displayName}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
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
      <main>
        {view === 'landing' && <LandingPage onStart={handleStart} />}
        {view === 'assessment' && <AssessmentForm onSubmit={handleAssessmentSubmit} isLoading={isLoading} />}
        {view === 'dashboard' && profile && (
          <Dashboard 
            profile={profile} 
            assessment={assessment} 
            loans={loans} 
            onApplyLoan={handleApplyLoan} 
          />
        )}
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
