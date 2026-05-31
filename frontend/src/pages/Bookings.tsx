import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Calendar, CheckCircle, LogOut as LogOutIcon } from 'lucide-react';
import { format } from 'date-fns';

const Bookings = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', filterStatus],
    queryFn: async () => {
      const response = await api.get('/bookings/', { params: { status: filterStatus } });
      return response.data;
    }
  });

  const checkInMutation = useMutation({
    mutationFn: (id: number) => api.post(`/bookings/${id}/check-in`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: number) => api.post(`/bookings/${id}/check-out`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ref / Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : bookings?.map((booking: any) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-blue-600">{booking.booking_reference}</div>
                  <div className="text-sm text-slate-900">{booking.guest.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{format(new Date(booking.check_in_date), 'MMM dd')} - {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">ID: {booking.room_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">${booking.total_cost}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => checkInMutation.mutate(booking.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Check-in
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => checkOutMutation.mutate(booking.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Check-out
                    </button>
                  )}
                  <button className="text-slate-400 hover:text-slate-600">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
