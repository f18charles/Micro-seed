import { useState, useEffect } from "react";
import AdminLayout, { AdminTab } from "./AdminLayout";
import Overview from "./Overview";
import LoanManagement from "./LoanManagement";
import UserManagement from "./UserManagement";
import Analytics from "./Analytics";
import RepaymentMonitoring from "./RepaymentMonitoring";
import AdminSettings from "./AdminSettings";
import DocumentReview from "./DocumentReview";
import LenderConfigPanel from "./LenderConfigPanel";
import PaymentGateway from "./PaymentGateway";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LoanApplication } from "../../types";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [pendingLoansCount, setPendingLoansCount] = useState(0);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "loans"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingLoansCount(snapshot.size);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'loans/pending'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "documents"), where("status", "==", "pending_review"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingDocsCount(snapshot.size);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents/pending'));
    return () => unsubscribe();
  }, []);

  const handleExit = () => {
    // This will be handled by App.tsx view state
    window.dispatchEvent(new CustomEvent('exit-admin'));
  };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onExit={handleExit}
      pendingLoansCount={pendingLoansCount}
      pendingDocsCount={pendingDocsCount}
    >
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'loans' && <LoanManagement />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'repayments' && <RepaymentMonitoring />}
      {activeTab === 'settings' && <AdminSettings />}
      {activeTab === 'documents' && <DocumentReview />}
      {activeTab === 'lender_config' && <LenderConfigPanel />}
      {activeTab === 'payments' && <PaymentGateway />}
    </AdminLayout>
  );
}
