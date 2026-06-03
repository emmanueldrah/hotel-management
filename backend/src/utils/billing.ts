/**
 * Pure billing/pricing helpers. Kept side-effect free so they are trivially
 * unit-testable and reusable across reservations, invoices and POS.
 */

export interface LineInput {
  quantity: number;
  unitPrice: number;
  taxRate?: number; // percentage, e.g. 10 = 10%
  isDiscount?: boolean;
}

export interface InvoiceTotals {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineAmount(line: LineInput): number {
  const gross = line.quantity * line.unitPrice;
  return round2(line.isDiscount ? -Math.abs(gross) : gross);
}

export function computeInvoiceTotals(lines: LineInput[]): InvoiceTotals {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  for (const line of lines) {
    const amount = lineAmount(line);
    if (amount < 0) {
      discountTotal += Math.abs(amount);
    } else {
      subtotal += amount;
      if (line.taxRate) taxTotal += amount * (line.taxRate / 100);
    }
  }

  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  discountTotal = round2(discountTotal);
  const total = round2(subtotal + taxTotal - discountTotal);
  return { subtotal, taxTotal, discountTotal, total };
}

/** Inclusive nights between two dates (min 1). */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return Math.max(1, nights);
}

/**
 * Simple dynamic pricing: scales the base rate by occupancy. Higher occupancy
 * pushes the price up (demand), low occupancy applies a small discount.
 */
export function dynamicRate(baseRate: number, occupancyRate: number): number {
  let multiplier = 1;
  if (occupancyRate >= 0.9) multiplier = 1.25;
  else if (occupancyRate >= 0.75) multiplier = 1.15;
  else if (occupancyRate >= 0.5) multiplier = 1.0;
  else multiplier = 0.9;
  return round2(baseRate * multiplier);
}
