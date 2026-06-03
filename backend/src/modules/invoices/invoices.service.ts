import { ChargeType, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateReference } from '../../utils/reference';
import { computeInvoiceTotals, lineAmount, round2 } from '../../utils/billing';

const invoiceInclude = {
  items: true,
  payments: true,
  guest: { select: { id: true, firstName: true, lastName: true, email: true } },
  reservation: { select: { id: true, reference: true } },
} satisfies Prisma.InvoiceInclude;

interface ItemInput {
  type?: ChargeType;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

function toLineInputs(items: ItemInput[]) {
  return items.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    taxRate: i.taxRate,
    isDiscount: i.type === 'DISCOUNT',
  }));
}

async function recomputeInvoice(invoiceId: string) {
  const items = await prisma.invoiceItem.findMany({ where: { invoiceId } });
  const totals = computeInvoiceTotals(
    items.map((i) => ({
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate),
      isDiscount: i.type === 'DISCOUNT',
    })),
  );
  const payments = await prisma.payment.aggregate({
    where: { invoiceId, status: 'COMPLETED' },
    _sum: { amount: true },
  });
  const amountPaid = round2(Number(payments._sum.amount ?? 0));
  const balanceDue = round2(totals.total - amountPaid);
  const status =
    balanceDue <= 0 && totals.total > 0
      ? 'PAID'
      : amountPaid > 0
        ? 'PARTIALLY_PAID'
        : undefined;

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      amountPaid,
      balanceDue,
      ...(status ? { status } : {}),
    },
    include: invoiceInclude,
  });
}

export async function createInvoice(input: {
  branchId: string;
  guestId?: string;
  reservationId?: string;
  items?: ItemInput[];
  notes?: string;
}) {
  const lineItems = input.items ?? [];
  const totals = computeInvoiceTotals(toLineInputs(lineItems));
  const invoice = await prisma.invoice.create({
    data: {
      number: generateReference('INV'),
      branchId: input.branchId,
      guestId: input.guestId,
      reservationId: input.reservationId,
      notes: input.notes,
      status: 'DRAFT',
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      balanceDue: totals.total,
      items: {
        create: lineItems.map((i) => ({
          type: i.type ?? 'OTHER',
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate ?? 0,
          amount: lineAmount({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            isDiscount: i.type === 'DISCOUNT',
          }),
        })),
      },
    },
    include: invoiceInclude,
  });
  return invoice;
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

export async function listInvoices(params: {
  branchId?: string;
  status?: string;
  guestId?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.InvoiceWhereInput = {
    ...(params.branchId ? { branchId: params.branchId } : {}),
    ...(params.status ? { status: params.status as never } : {}),
    ...(params.guestId ? { guestId: params.guestId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    }),
    prisma.invoice.count({ where }),
  ]);
  return { items, total };
}

export async function addItem(invoiceId: string, item: ItemInput) {
  await getInvoice(invoiceId);
  await prisma.invoiceItem.create({
    data: {
      invoiceId,
      type: item.type ?? 'OTHER',
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
      amount: lineAmount({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        isDiscount: item.type === 'DISCOUNT',
      }),
    },
  });
  return recomputeInvoice(invoiceId);
}

export async function removeItem(invoiceId: string, itemId: string) {
  await prisma.invoiceItem.delete({ where: { id: itemId } });
  return recomputeInvoice(invoiceId);
}

export async function issueInvoice(invoiceId: string) {
  await getInvoice(invoiceId);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'ISSUED', issuedAt: new Date() },
  });
  return recomputeInvoice(invoiceId);
}

export { recomputeInvoice };
