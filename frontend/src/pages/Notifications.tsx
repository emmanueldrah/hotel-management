import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Bell, Check } from 'lucide-react';
import { format } from 'date-fns';

const Notifications = () => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications/');
      return response.data;
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <div className="bg-white shadow rounded-lg divide-y divide-slate-100">
        {isLoading ? <div className="p-6 text-center text-slate-500">Loading...</div> :
         notifications?.length === 0 ? <div className="p-6 text-center text-slate-500">No notifications yet.</div> :
         notifications?.map((notif: any) => (
          <div key={notif.id} className={`p-4 flex items-start ${notif.is_read ? 'bg-white' : 'bg-blue-50'}`}>
            <div className={`p-2 rounded-full mr-4 ${notif.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</h3>
                <span className="text-xs text-slate-400">{format(new Date(notif.created_at), 'MMM dd, HH:mm')}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
              {!notif.is_read && (
                <button
                  onClick={() => markReadMutation.mutate(notif.id)}
                  className="text-xs text-blue-600 font-medium hover:underline flex items-center"
                >
                  <Check className="w-3 h-3 mr-1" /> Mark as read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
