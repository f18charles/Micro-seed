import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "sonner";

export function useInactivityLogout(timeoutMs: number = 30 * 60 * 1000) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (auth.currentUser) {
        await signOut(auth);
        toast.info("You've been signed out due to inactivity.");
      }
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    const handleActivity = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);
}
