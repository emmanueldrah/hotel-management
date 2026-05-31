import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { FileText, Download, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const Billing = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices');
      return response.data;
    }
  });

  const downloadPDF = async (id: number) => {
    const response = await api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing & Invoicing</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : invoices?.map((invoice: any) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{invoice.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">#{invoice.booking_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${(invoice.total_amount + invoice.tax_amount).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => downloadPDF(invoice.id)} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <DollarSign className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Billing;
