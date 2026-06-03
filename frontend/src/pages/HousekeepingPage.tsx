import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

interface HousekeepingTask {
  id: string;
  status: string;
  notes?: string;
  room?: { number: string };
  assignedTo?: { name: string };
  createdAt: string;
}

const NEXT_STATUS: Record<string, string> = {
  DIRTY: 'IN_PROGRESS',
  IN_PROGRESS: 'CLEAN',
  CLEAN: 'INSPECTED',
};

export default function HousekeepingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['housekeeping'],
    queryFn: () => fetchList<HousekeepingTask>('/housekeeping', { limit: 100 }),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/housekeeping/${id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['housekeeping'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const tasks = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Housekeeping" subtitle="Room cleaning tasks and inspections" />
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : tasks.length === 0 ? (
          <EmptyState message="No housekeeping tasks." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Room</th>
                <th className="th">Status</th>
                <th className="th">Assigned</th>
                <th className="th">Created</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td font-medium">#{t.room?.number ?? '—'}</td>
                  <td className="td">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="td">{t.assignedTo?.name ?? 'Unassigned'}</td>
                  <td className="td text-xs">{t.createdAt.slice(0, 10)}</td>
                  <td className="td">
                    {NEXT_STATUS[t.status] && (
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        onClick={() => update.mutate({ id: t.id, status: NEXT_STATUS[t.status] })}
                        disabled={update.isPending}
                      >
                        Mark {NEXT_STATUS[t.status].replace(/_/g, ' ')}
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
