import { useQuery } from '@tanstack/react-query';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  BedDouble,
  CalendarArrowDown,
  CalendarArrowUp,
  DollarSign,
  Percent,
  TrendingUp,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { fetchOne, fetchList } from '@/lib/queries';
import type { DashboardStats } from '@/types';
import { Card, PageHeader, Spinner } from '@/components/ui';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

interface TrendPoint {
  date: string;
  amount: number;
}
interface OccupancyPoint {
  status: string;
  count: number;
}

const KPIS: {
  key: keyof DashboardStats;
  label: string;
  icon: typeof BedDouble;
  format?: (v: number) => string;
  accent: string;
}[] = [
  { key: 'occupancyRate', label: 'Occupancy Rate', icon: Percent, format: (v) => `${v}%`, accent: 'text-brand-600' },
  { key: 'revenueToday', label: 'Revenue Today', icon: DollarSign, format: (v) => `$${v.toLocaleString()}`, accent: 'text-emerald-600' },
  { key: 'revenueThisMonth', label: 'Revenue (Month)', icon: TrendingUp, format: (v) => `$${v.toLocaleString()}`, accent: 'text-emerald-600' },
  { key: 'availableRooms', label: 'Available Rooms', icon: BedDouble, accent: 'text-blue-600' },
  { key: 'todayCheckIns', label: "Today's Check-ins", icon: CalendarArrowDown, accent: 'text-violet-600' },
  { key: 'todayCheckOuts', label: "Today's Check-outs", icon: CalendarArrowUp, accent: 'text-amber-600' },
  { key: 'pendingPayments', label: 'Pending Payments', icon: DollarSign, format: (v) => `$${v.toLocaleString()}`, accent: 'text-red-600' },
  { key: 'pendingMaintenance', label: 'Open Maintenance', icon: Wrench, accent: 'text-orange-600' },
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#3b82f6',
  RESERVED: '#f59e0b',
  CLEANING: '#06b6d4',
  MAINTENANCE: '#f97316',
  OUT_OF_SERVICE: '#94a3b8',
};

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => fetchOne<DashboardStats>('/dashboard/stats') });
  const trendQuery = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => fetchList<TrendPoint>('/dashboard/revenue-trend', { days: 30 }),
  });
  const occQuery = useQuery({
    queryKey: ['occupancy-by-type'],
    queryFn: () => fetchList<OccupancyPoint>('/dashboard/occupancy-by-type'),
  });

  if (statsQuery.isLoading) return <Spinner label="Loading dashboard…" />;
  const stats = statsQuery.data;

  const trend = trendQuery.data?.items ?? [];
  const occ = occQuery.data?.items ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your property operations" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const value = stats ? stats[kpi.key] : 0;
          return (
            <Card key={kpi.key} className="flex items-center gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 ${kpi.accent}`}>
                <kpi.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.format ? kpi.format(Number(value)) : value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold">Revenue — last 30 days</h3>
          <Line
            data={{
              labels: trend.map((t) => t.date.slice(5)),
              datasets: [
                {
                  label: 'Revenue',
                  data: trend.map((t) => t.amount),
                  borderColor: '#0069c6',
                  backgroundColor: 'rgba(12,135,232,0.15)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
            height={110}
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Room status</h3>
          {occ.length ? (
            <Doughnut
              data={{
                labels: occ.map((o) => o.status.replace(/_/g, ' ')),
                datasets: [
                  {
                    data: occ.map((o) => o.count),
                    backgroundColor: occ.map((o) => STATUS_COLORS[o.status] ?? '#94a3b8'),
                    borderWidth: 0,
                  },
                ],
              }}
              options={{ plugins: { legend: { position: 'bottom' } } }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No room data</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold">Occupancy snapshot</h3>
          <Bar
            data={{
              labels: ['Total', 'Occupied', 'Available', 'Active Reservations'],
              datasets: [
                {
                  label: 'Rooms',
                  data: [
                    stats?.totalRooms ?? 0,
                    stats?.occupiedRooms ?? 0,
                    stats?.availableRooms ?? 0,
                    stats?.activeReservations ?? 0,
                  ],
                  backgroundColor: ['#64748b', '#3b82f6', '#10b981', '#8b5cf6'],
                  borderRadius: 6,
                },
              ],
            }}
            options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
            height={90}
          />
        </Card>
        <Card className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2 text-brand-600">
            <Sparkles size={18} />
            <h3 className="font-semibold">Housekeeping</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rooms needing attention</p>
          <p className="text-4xl font-bold">{stats?.housekeepingDirty ?? 0}</p>
          <p className="text-xs text-slate-400">Dirty / in-progress rooms across the property</p>
        </Card>
      </div>
    </div>
  );
}
