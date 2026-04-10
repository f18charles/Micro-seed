import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDev() {
  return (import.meta as any).env.DEV
}

export function toISOString(ts: Timestamp | string | undefined | null): string {
  if (!ts) return new Date().toISOString()
  if (typeof ts === 'string') return ts
  if (ts instanceof Timestamp) return ts.toDate().toISOString()
  return new Date().toISOString()
}

export function formatDate(ts: Timestamp | string | undefined | null, formatStr: string = 'PPP'): string {
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts || Date.now())
  return format(date, formatStr)
}

export function maskPhone(phone: string): string {
  if (!phone) return ""
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length < 7) return phone
  return `+${cleaned.slice(0, 3)} ${"*".repeat(cleaned.length - 7)} ${cleaned.slice(-4)}`
}
