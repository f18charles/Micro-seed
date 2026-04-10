export function checkRateLimit(action: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const historyStr = sessionStorage.getItem(`rate_limit_${action}`);
  const history: number[] = historyStr ? JSON.parse(historyStr) : [];
  
  // Filter attempts within the window
  const recentAttempts = history.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  return true;
}

export function recordAttempt(action: string): void {
  const now = Date.now();
  const historyStr = sessionStorage.getItem(`rate_limit_${action}`);
  const history: number[] = historyStr ? JSON.parse(historyStr) : [];
  
  history.push(now);
  sessionStorage.setItem(`rate_limit_${action}`, JSON.stringify(history));
}
