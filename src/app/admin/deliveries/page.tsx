'use client';

import { useApp } from '@/context/AppContext';
import { Package, MapPin, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDeliveries() {
  const { deliveries } = useApp();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">All Deliveries</h1>
        <p className="text-gray-500">Monitor all transactions and delivery statuses in real-time.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Route / ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stakeholders</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fee</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deliveries.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-[#00B14F]"></span>
                      <span className="truncate">{d.pickup_location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="truncate">{d.dropoff_location}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">ID: {d.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 font-medium">Cust:</span>
                    <span className="font-bold text-gray-900">{d.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 font-medium">Driver:</span>
                    <span className="font-bold text-[#00B14F]">{d.driver_name || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-gray-900">{formatCurrency(d.delivery_fee)}</p>
                  <p className="text-[10px] text-gray-400 uppercase">{d.payment_method}</p>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(d.delivery_status)}`}>
                    {d.delivery_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm text-gray-600">{new Date(d.booking_time).toLocaleDateString()}</p>
                  <p className="text-[10px] text-gray-400">{new Date(d.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveries.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No deliveries recorded yet.</div>}
      </div>
    </div>
  );
}
