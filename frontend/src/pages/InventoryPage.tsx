import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  quantity: number | string;
  reorderLevel: number | string;
  unitCost?: number | string;
  supplier?: { name: string };
}

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => fetchList<InventoryItem>('/inventory', { limit: 100 }),
  });

  const items = data?.items ?? [];
  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.reorderLevel)).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Food, housekeeping and maintenance supplies"
        actions={
          lowStock > 0 ? (
            <span className="badge inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={14} /> {lowStock} low stock
            </span>
          ) : undefined
        }
      />

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState message="No inventory items yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Item</th>
                <th className="th">SKU</th>
                <th className="th">Category</th>
                <th className="th">In stock</th>
                <th className="th">Reorder at</th>
                <th className="th">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((i) => {
                const low = Number(i.quantity) <= Number(i.reorderLevel);
                return (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="td font-medium">{i.name}</td>
                    <td className="td font-mono text-xs">{i.sku ?? '—'}</td>
                    <td className="td">{i.category ?? '—'}</td>
                    <td className="td">
                      <span className={low ? 'font-semibold text-amber-600' : ''}>
                        {Number(i.quantity)} {i.unit ?? ''}
                      </span>
                      {low && <AlertTriangle size={14} className="ml-1 inline text-amber-500" />}
                    </td>
                    <td className="td">{Number(i.reorderLevel)}</td>
                    <td className="td">{i.supplier?.name ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
