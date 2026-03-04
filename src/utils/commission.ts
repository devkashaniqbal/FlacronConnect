// ─────────────────────────────────────────────────────────────────────────────
// Commission Calculation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Calculate the commission amount for a single booking. */
export function calcCommission(amount: number, ratePercent: number): number {
  return parseFloat(((amount * ratePercent) / 100).toFixed(2))
}

/** Aggregate total commissions earned by an employee over a set of bookings. */
export function totalCommissionForEmployee(
  bookings: Array<{ amount?: number; commissionRate?: number; commissionAmount?: number }>,
): number {
  return bookings.reduce((sum, b) => {
    if (b.commissionAmount !== undefined) return sum + b.commissionAmount
    if (b.amount && b.commissionRate) return sum + calcCommission(b.amount, b.commissionRate)
    return sum
  }, 0)
}
