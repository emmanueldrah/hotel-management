import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchList<AuditLog>('/audit-logs', { limit: 100 }),
  });

  const logs = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="User activity and system changes" />
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} message="No activity recorded yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Time</th>
                <th className="th">User</th>
                <th className="th">Action</th>
                <th className="th">Entity</th>
                <th className="th">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td whitespace-nowrap text-xs">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="td">{l.user?.name ?? 'System'}</td>
                  <td className="td font-medium">{l.action}</td>
                  <td className="td">
                    {l.entity}
                    {l.entityId && <span className="text-xs text-slate-400"> · {l.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="td font-mono text-xs">{l.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
