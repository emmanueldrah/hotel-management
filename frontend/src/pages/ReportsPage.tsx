import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { fetchOne } from '@/lib/queries';
import { downloadCsv } from '@/lib/csv';
import { Card, PageHeader, Spinner } from '@/components/ui';

interface RevenueReport {
  totalRevenue: number;
  transactions: number;
  byMethod: { method: string; amount: number }[];
}
interface OccupancyReport {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}
interface GuestReport {
  totalGuests: number;
  vipGuests: number;
  byTier: { tier: string; count: number }[];
}

export default function ReportsPage() {
  const revenue = useQuery({ queryKey: ['report-revenue'], queryFn: () => fetchOne<RevenueReport>('/reports/revenue') });
  const occupancy = useQuery({ queryKey: ['report-occupancy'], queryFn: () => fetchOne<OccupancyReport>('/reports/occupancy') });
  const guests = useQuery({ queryKey: ['report-guests'], queryFn: () => fetchOne<GuestReport>('/reports/guests') });

  if (revenue.isLoading || occupancy.isLoading || guests.isLoading) return <Spinner label="Building reports…" />;

  const exportAll = () => {
    const rows = [
      { metric: 'Total revenue', value: revenue.data?.totalRevenue ?? 0 },
      { metric: 'Transactions', value: revenue.data?.transactions ?? 0 },
      { metric: 'Occupancy rate (%)', value: occupancy.data?.occupancyRate ?? 0 },
      { metric: 'Occupied rooms', value: occupancy.data?.occupiedRooms ?? 0 },
      { metric: 'Total rooms', value: occupancy.data?.totalRooms ?? 0 },
      { metric: 'Total guests', value: guests.data?.totalGuests ?? 0 },
      { metric: 'VIP guests', value: guests.data?.vipGuests ?? 0 },
      ...(revenue.data?.byMethod ?? []).map((m) => ({ metric: `Revenue · ${m.method}`, value: m.amount })),
      ...(guests.data?.byTier ?? []).map((t) => ({ metric: `Guests · ${t.tier}`, value: t.count })),
    ];
    downloadCsv('hms-report.csv', rows);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational and financial summaries"
        actions={
          <button className="btn-secondary" onClick={exportAll}>
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="font-semibold">Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            ${revenue.data?.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{revenue.data?.transactions} transactions</p>
          <div className="mt-4 space-y-1 text-sm">
            {revenue.data?.byMethod.map((m) => (
              <div key={m.method} className="flex justify-between">
                <span className="text-slate-500">{m.method.replace(/_/g, ' ')}</span>
                <span className="font-medium">${m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Occupancy</h3>
          <p className="mt-2 text-3xl font-bold text-brand-600">{occupancy.data?.occupancyRate}%</p>
          <p className="text-sm text-slate-400">
            {occupancy.data?.occupiedRooms} / {occupancy.data?.totalRooms} rooms occupied
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold">Guests</h3>
          <p className="mt-2 text-3xl font-bold text-violet-600">{guests.data?.totalGuests}</p>
          <p className="text-sm text-slate-400">{guests.data?.vipGuests} VIP guests</p>
          <div className="mt-4 space-y-1 text-sm">
            {guests.data?.byTier.map((t) => (
              <div key={t.tier} className="flex justify-between">
                <span className="text-slate-500">{t.tier}</span>
                <span className="font-medium">{t.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
