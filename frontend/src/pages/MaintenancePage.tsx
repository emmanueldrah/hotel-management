import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

interface Ticket {
  id: string;
  title: string;
  issue: string;
  status: string;
  priority: string;
  room?: { number: string };
  assignedTo?: { name: string };
  createdAt: string;
}

const NEXT_STATUS: Record<string, string> = {
  OPEN: 'ASSIGNED',
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => fetchList<Ticket>('/maintenance', { limit: 100 }),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/maintenance/${id}`, { status }),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const tickets = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Repair tickets and tracking"
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Report issue
          </button>
        }
      />

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : tickets.length === 0 ? (
          <EmptyState message="No maintenance tickets." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Title</th>
                <th className="th">Room</th>
                <th className="th">Priority</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.issue}</p>
                  </td>
                  <td className="td">{t.room?.number ? `#${t.room.number}` : '—'}</td>
                  <td className="td">
                    <StatusBadge status={t.priority} />
                  </td>
                  <td className="td">
                    <StatusBadge status={t.status} />
                  </td>
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

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['maintenance'] });
          }}
        />
      )}
    </div>
  );
}

function CreateTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const create = useMutation({
    mutationFn: () => api.post('/maintenance', { title, issue, priority }),
    onSuccess: () => {
      toast.success('Ticket created');
      onCreated();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Report maintenance issue</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leaking faucet" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={issue} onChange={(e) => setIssue(e.target.value)} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!title || !issue || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
