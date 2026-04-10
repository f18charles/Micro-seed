import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AuditLog } from "../types";

export const auditLogService = {
  async writeAuditLog(log: Omit<AuditLog, 'id' | 'createdAt' | 'adminId' | 'adminEmail'>): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, "audit_logs"), {
        ...log,
        adminId: user.uid,
        adminEmail: user.email,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // We don't throw here to avoid blocking the main action if logging fails, 
      // though in a real financial app you might want to ensure logging succeeds.
    }
  }
};
