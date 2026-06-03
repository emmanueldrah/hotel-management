import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchList } from '@/lib/queries';
import type { Room } from '@/types';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

const STATUSES = ['', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE'];

export default function RoomsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['rooms', status],
    queryFn: () => fetchList<Room>('/rooms', { limit: 100, ...(status ? { status } : {}) }),
  });

  const rooms = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Room inventory and live status"
        actions={
          <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace(/_/g, ' ') : 'All statuses'}
              </option>
            ))}
          </select>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : rooms.length === 0 ? (
        <EmptyState message="No rooms found." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rooms.map((room) => (
            <Card key={room.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">#{room.number}</span>
                <StatusBadge status={room.status} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{room.roomType?.name}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Floor {room.floor ?? '—'}</span>
                <span className="font-semibold text-brand-600">${Number(room.pricePerNight)}/night</span>
              </div>
              <p className="text-xs text-slate-400">Capacity: {room.capacity} · {room.bedType}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
