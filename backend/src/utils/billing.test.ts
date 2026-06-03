import {
  computeInvoiceTotals,
  dynamicRate,
  lineAmount,
  nightsBetween,
  round2,
} from './billing';

describe('billing utils', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });

  it('computes a positive line amount', () => {
    expect(lineAmount({ quantity: 3, unitPrice: 120 })).toBe(360);
  });

  it('treats discount lines as negative', () => {
    expect(lineAmount({ quantity: 1, unitPrice: 50, isDiscount: true })).toBe(-50);
  });

  it('computes invoice totals with tax and discount', () => {
    const totals = computeInvoiceTotals([
      { quantity: 2, unitPrice: 100, taxRate: 10 }, // 200 + 20 tax
      { quantity: 1, unitPrice: 50 }, // 50
      { quantity: 1, unitPrice: 30, isDiscount: true }, // -30
    ]);
    expect(totals.subtotal).toBe(250);
    expect(totals.taxTotal).toBe(20);
    expect(totals.discountTotal).toBe(30);
    expect(totals.total).toBe(240);
  });

  it('counts nights inclusively with a minimum of 1', () => {
    expect(nightsBetween(new Date('2026-07-01'), new Date('2026-07-04'))).toBe(3);
    expect(nightsBetween(new Date('2026-07-01'), new Date('2026-07-01'))).toBe(1);
  });

  it('applies demand-based dynamic pricing', () => {
    expect(dynamicRate(100, 0.95)).toBe(125);
    expect(dynamicRate(100, 0.3)).toBe(90);
    expect(dynamicRate(100, 0.6)).toBe(100);
  });
});
