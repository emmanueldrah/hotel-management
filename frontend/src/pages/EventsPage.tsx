import { useQuery } from '@tanstack/react-query';
import { CalendarRange } from 'lucide-react';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

interface EventRecord {
  id: string;
  name: string;
  venue?: string;
  startDate: string;
  endDate: string;
  attendees: number;
  packageName?: string;
  cost: number | string;
  status: string;
  guest?: { firstName: string; lastName: string };
}

export default function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchList<EventRecord>('/events', { limit: 50 }),
  });

  const events = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Events & Conferences" subtitle="Hall and conference room bookings" />
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarRange} message="No events booked yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Event</th>
                <th className="th">Venue</th>
                <th className="th">Dates</th>
                <th className="th">Attendees</th>
                <th className="th">Cost</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td">
                    <p className="font-medium">{e.name}</p>
                    {e.packageName && <p className="text-xs text-slate-400">{e.packageName}</p>}
                  </td>
                  <td className="td">{e.venue ?? '—'}</td>
                  <td className="td whitespace-nowrap text-xs">
                    {e.startDate.slice(0, 10)} → {e.endDate.slice(0, 10)}
                  </td>
                  <td className="td">{e.attendees}</td>
                  <td className="td font-semibold">${Number(e.cost)}</td>
                  <td className="td">
                    <StatusBadge status={e.status} />
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
