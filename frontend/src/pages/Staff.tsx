import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { UserPlus, Mail, Phone, Badge } from 'lucide-react';

const Staff = () => {
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div>Loading...</div> : staff?.map((member: any) => (
          <div key={member.id} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-600 mr-4">
                  {member.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{member.full_name}</h3>
                  <p className="text-sm text-slate-500 capitalize">{member.role} • {member.department?.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="w-4 h-4 mr-2" /> {member.email}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="w-4 h-4 mr-2" /> {member.phone || 'N/A'}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
                <button className="text-blue-600 hover:underline text-sm font-medium">Edit Profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
