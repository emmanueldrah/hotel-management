import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UtensilsCrossed } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

interface MenuItem {
  id: string;
  name: string;
  category?: string;
  price: number | string;
  available: boolean;
}
interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  menuItem?: { name: string };
}
interface RestaurantOrder {
  id: string;
  reference: string;
  status: string;
  total: number | string;
  table?: { name: string };
  items?: OrderItem[];
  createdAt: string;
}

const NEXT_STATUS: Record<string, string> = {
  OPEN: 'PREPARING',
  PREPARING: 'SERVED',
  SERVED: 'BILLED',
};

export default function RestaurantPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');

  const ordersQuery = useQuery({
    queryKey: ['restaurant-orders'],
    queryFn: () => fetchList<RestaurantOrder>('/restaurant-orders', { limit: 50 }),
  });
  const menuQuery = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => fetchList<MenuItem>('/menu-items', { limit: 100 }),
  });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/restaurant-orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Order updated');
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const orders = ordersQuery.data?.items ?? [];
  const menu = menuQuery.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Restaurant & POS"
        subtitle="Menu, orders and kitchen status"
        actions={
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {(['orders', 'menu'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize ${
                  tab === t ? 'bg-brand-600 text-white' : 'text-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      {tab === 'orders' ? (
        <Card className="overflow-x-auto p-0">
          {ordersQuery.isLoading ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} message="No restaurant orders yet." />
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Table</th>
                  <th className="th">Items</th>
                  <th className="th">Total</th>
                  <th className="th">Status</th>
                  <th className="th">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="td font-mono text-xs">{o.reference}</td>
                    <td className="td">{o.table?.name ?? '—'}</td>
                    <td className="td text-xs">
                      {o.items?.map((it) => `${it.quantity}× ${it.menuItem?.name}`).join(', ') ?? '—'}
                    </td>
                    <td className="td font-semibold">${Number(o.total)}</td>
                    <td className="td">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="td">
                      {NEXT_STATUS[o.status] && (
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => advance.mutate({ id: o.id, status: NEXT_STATUS[o.status] })}
                          disabled={advance.isPending}
                        >
                          Mark {NEXT_STATUS[o.status].toLowerCase()}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {menuQuery.isLoading ? (
            <Spinner />
          ) : menu.length === 0 ? (
            <EmptyState message="No menu items yet." />
          ) : (
            menu.map((m) => (
              <Card key={m.id} className="space-y-1">
                <div className="flex items-start justify-between">
                  <span className="font-semibold">{m.name}</span>
                  <span className="font-semibold text-brand-600">${Number(m.price)}</span>
                </div>
                <p className="text-xs text-slate-400">{m.category ?? 'Uncategorised'}</p>
                <span
                  className={`badge ${
                    m.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {m.available ? 'Available' : 'Unavailable'}
                </span>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
