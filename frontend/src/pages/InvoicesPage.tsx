import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import type { Invoice } from '@/types';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetchList<Invoice>('/invoices', { limit: 50 }),
  });

  const pay = useMutation({
    mutationFn: (invoice: Invoice) =>
      api.post('/payments', {
        invoiceId: invoice.id,
        amount: Number(invoice.balanceDue),
        method: 'CASH',
      }),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const invoices = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Billing & Invoices" subtitle="Invoices, balances and payments" />

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : invoices.length === 0 ? (
          <EmptyState message="No invoices yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Invoice</th>
                <th className="th">Guest</th>
                <th className="th">Total</th>
                <th className="th">Paid</th>
                <th className="th">Balance</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td font-mono text-xs">{inv.number}</td>
                  <td className="td">
                    {inv.guest ? `${inv.guest.firstName} ${inv.guest.lastName}` : '—'}
                  </td>
                  <td className="td font-semibold">${Number(inv.total)}</td>
                  <td className="td">${Number(inv.amountPaid)}</td>
                  <td className="td font-semibold text-red-600">${Number(inv.balanceDue)}</td>
                  <td className="td">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="td">
                    {Number(inv.balanceDue) > 0 && (
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        onClick={() => pay.mutate(inv)}
                        disabled={pay.isPending}
                      >
                        <CreditCard size={14} /> Take payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
