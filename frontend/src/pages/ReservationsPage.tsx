import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, LogIn, LogOut, X } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { fetchList } from '@/lib/queries';
import type { Guest, Reservation, Room } from '@/types';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => fetchList<Reservation>('/reservations', { limit: 50 }),
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => api.post(`/reservations/${id}/check-in`),
    onSuccess: () => {
      toast.success('Guest checked in');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const checkOut = useMutation({
    mutationFn: (id: string) => api.post(`/reservations/${id}/check-out`),
    onSuccess: () => {
      toast.success('Guest checked out — invoice generated');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const reservations = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Reservations"
        subtitle="Bookings, check-in and check-out"
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New reservation
          </button>
        }
      />

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : reservations.length === 0 ? (
          <EmptyState message="No reservations yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Reference</th>
                <th className="th">Guest</th>
                <th className="th">Rooms</th>
                <th className="th">Dates</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td font-mono text-xs">{r.reference}</td>
                  <td className="td font-medium">
                    {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : '—'}
                  </td>
                  <td className="td">{r.rooms?.map((rm) => rm.room.number).join(', ')}</td>
                  <td className="td whitespace-nowrap text-xs">
                    {r.checkInDate.slice(0, 10)} → {r.checkOutDate.slice(0, 10)}
                  </td>
                  <td className="td font-semibold">${Number(r.totalAmount)}</td>
                  <td className="td">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => checkIn.mutate(r.id)}
                          disabled={checkIn.isPending}
                        >
                          <LogIn size={14} /> Check in
                        </button>
                      )}
                      {r.status === 'CHECKED_IN' && (
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => checkOut.mutate(r.id)}
                          disabled={checkOut.isPending}
                        >
                          <LogOut size={14} /> Check out
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && (
        <CreateReservationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['reservations'] });
          }}
        />
      )}
    </div>
  );
}

function CreateReservationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [guestId, setGuestId] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  const guestsQuery = useQuery({
    queryKey: ['guests-all'],
    queryFn: () => fetchList<Guest>('/guests', { limit: 100 }),
  });

  const availabilityQuery = useQuery({
    queryKey: ['availability', checkIn, checkOut],
    queryFn: () =>
      fetchList<Room>('/reservations/availability', { checkIn, checkOut }),
    enabled: Boolean(checkIn && checkOut && checkOut > checkIn),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/reservations', {
        guestId,
        roomIds: selectedRooms,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      }),
    onSuccess: () => {
      toast.success('Reservation created');
      onCreated();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const rooms = availabilityQuery.data?.items ?? [];
  const toggleRoom = (id: string) =>
    setSelectedRooms((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const canSubmit = guestId && selectedRooms.length > 0 && checkOut > checkIn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">New reservation</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Guest</label>
            <select className="input" value={guestId} onChange={(e) => setGuestId(e.target.value)}>
              <option value="">Select a guest…</option>
              {guestsQuery.data?.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.firstName} {g.lastName} {g.email ? `(${g.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check-in</label>
              <input type="date" className="input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="date" className="input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Available rooms</label>
            {availabilityQuery.isLoading ? (
              <Spinner />
            ) : rooms.length === 0 ? (
              <p className="text-sm text-slate-400">No rooms available for these dates.</p>
            ) : (
              <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleRoom(room.id)}
                    className={`rounded-lg border p-2 text-left text-sm transition ${
                      selectedRooms.includes(room.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                        : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-semibold">#{room.number}</p>
                    <p className="text-xs text-slate-400">{room.roomType?.name}</p>
                    <p className="text-xs font-medium text-brand-600">${Number(room.pricePerNight)}/night</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? 'Creating…' : 'Create reservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
