import { UserProfile } from "../types";

export function checkAuthGuard(user: UserProfile | null, view: string): { allowed: boolean; reason: string } {
  const protectedViews = ['dashboard', 'profile', 'admin', 'assessment'];
  
  if (protectedViews.includes(view) && !user) {
    return { allowed: false, reason: "Please login to access this page." };
  }

  if (view === 'admin' && user?.role !== 'admin') {
    return { allowed: false, reason: "Access denied. Admin privileges required." };
  }

  return { allowed: true, reason: "" };
}
