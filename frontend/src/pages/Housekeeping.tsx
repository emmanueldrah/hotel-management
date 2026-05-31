import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Brush, CheckCircle, AlertTriangle } from 'lucide-react';

const Housekeeping = () => {
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms-housekeeping'],
    queryFn: async () => {
      const response = await api.get('/rooms/');
      return response.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      api.patch(`/housekeeping/rooms/${id}/status`, null, { params: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms-housekeeping'] })
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-100 text-green-700';
      case 'dirty': return 'bg-red-100 text-red-700';
      case 'being_cleaned': return 'bg-blue-100 text-blue-700';
      case 'inspected': return 'bg-purple-100 text-purple-700';
      case 'out_of_order': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Housekeeping Schedule</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? <div>Loading...</div> : rooms?.map((room: any) => (
          <div key={room.id} className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">Room {room.room_number}</h3>
                <p className="text-sm text-slate-500 capitalize">{room.room_type}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full uppercase font-semibold ${getStatusColor(room.housekeeping_status)}`}>
                {room.housekeeping_status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['clean', 'dirty', 'being_cleaned', 'inspected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatusMutation.mutate({ id: room.id, status })}
                    className="px-2 py-1 text-xs border rounded hover:bg-slate-50 capitalize"
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Housekeeping;
