import { format, formatDistanceToNow, parseISO } from 'date-fns'

// Handles Date, string ISO, or Firestore Timestamp (has .toDate())
function toDate(date: unknown): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  if (typeof date === 'string') return parseISO(date)
  if (typeof (date as { toDate?: unknown }).toDate === 'function') {
    return (date as { toDate: () => Date }).toDate()
  }
  return new Date(date as number)
}

export function formatDate(date: unknown, pattern = 'MMM d, yyyy'): string {
  return format(toDate(date), pattern)
}

export function formatTime(date: unknown): string {
  return format(toDate(date), 'h:mm a')
}

export function formatDateTime(date: unknown): string {
  return format(toDate(date), 'MMM d, yyyy h:mm a')
}

export function formatRelative(date: unknown): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true })
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function formatInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
