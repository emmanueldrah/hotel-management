import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, Globe, Mail, DollarSign, Clock } from 'lucide-react';

const Settings = () => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      hotelName: 'Grand Hotel',
      email: 'contact@hotel.com',
      currency: 'USD',
      taxRate: 10,
      checkIn: '14:00',
      checkOut: '11:00'
    }
  });

  const onSubmit = (data: any) => {
    console.log(data);
    alert('Settings saved (mock)');
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
            <Globe className="w-5 h-5 mr-2 text-blue-600" /> Hotel Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name</label>
              <input {...register('hotelName')} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
              <input {...register('email')} type="email" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" /> Financial Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
              <select {...register('currency')} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input {...register('taxRate')} type="number" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
            <Clock className="w-5 h-5 mr-2 text-orange-600" /> Policy Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Time</label>
              <input {...register('checkIn')} type="time" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Time</label>
              <input {...register('checkOut')} type="time" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow shadow-blue-200">
            <Save className="w-4 h-4 mr-2" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
