import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Filter, Search } from 'lucide-react';

const Rooms = () => {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms', filterType, filterStatus],
    queryFn: async () => {
      const params: any = {};
      if (filterType) params.room_type = filterType;
      if (filterStatus) params.status = filterStatus;
      const response = await api.get('/rooms/', { params });
      return response.data;
    }
  });

  if (isLoading) return <div>Loading rooms...</div>;
  if (error) return <div>Error loading rooms</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Room Management</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Room
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-2 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="twin">Twin</option>
            <option value="suite">Suite</option>
            <option value="vip">VIP</option>
            <option value="presidential">Presidential</option>
          </select>
        </div>
        <div className="flex items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room: any) => (
          <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">Room {room.room_number}</h3>
                <span className={`px-2 py-1 text-xs rounded-full uppercase font-semibold ${
                  room.status === 'available' ? 'bg-green-100 text-green-700' :
                  room.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {room.status}
                </span>
              </div>
              <p className="text-slate-500 text-sm capitalize mb-4">{room.room_type} Room • Floor {room.floor}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-slate-900">${room.price_per_night}<span className="text-xs font-normal text-slate-500">/night</span></span>
                <button className="text-blue-600 hover:underline text-sm font-medium">Edit Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rooms;
