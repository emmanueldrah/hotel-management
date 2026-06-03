import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell, Check } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

interface Notification {
  id: string;
  title: string;
  message: string;
  status: string;
  channel: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchList<Notification>('/notifications', { limit: 50 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Your alerts and reminders" />
      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} message="You're all caught up." />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const unread = n.status !== 'READ';
            return (
              <Card
                key={n.id}
                className={`flex items-start justify-between gap-4 ${
                  unread ? 'border-l-4 border-l-brand-500' : ''
                }`}
              >
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.channel} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {unread && (
                  <button
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                  >
                    <Check size={14} /> Mark read
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
