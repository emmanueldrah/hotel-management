import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { fetchList } from '@/lib/queries';
import type { Guest } from '@/types';
import { Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'text-amber-700',
  SILVER: 'text-slate-400',
  GOLD: 'text-yellow-500',
  PLATINUM: 'text-violet-500',
};

export default function GuestsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['guests', q],
    queryFn: () => fetchList<Guest>('/guests', { limit: 50, ...(q ? { q } : {}) }),
  });

  const guests = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Guests"
        subtitle="Guest profiles and loyalty"
        actions={
          <input
            className="input max-w-[260px]"
            placeholder="Search guests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      />

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : guests.length === 0 ? (
          <EmptyState message="No guests found." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Nationality</th>
                <th className="th">Loyalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {guests.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td font-medium">
                    <span className="flex items-center gap-2">
                      {g.firstName} {g.lastName}
                      {g.isVip && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                    </span>
                  </td>
                  <td className="td">{g.email ?? '—'}</td>
                  <td className="td">{g.phone ?? '—'}</td>
                  <td className="td">{g.nationality ?? '—'}</td>
                  <td className="td">
                    <span className={`font-semibold ${TIER_COLORS[g.loyaltyTier] ?? ''}`}>
                      {g.loyaltyTier}
                    </span>{' '}
                    <span className="text-xs text-slate-400">({g.loyaltyPoints} pts)</span>
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
