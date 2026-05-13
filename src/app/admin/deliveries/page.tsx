'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Package, MapPin, Truck, CheckCircle, XCircle, Clock, Eye, X, CreditCard, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDeliveries() {
  const { deliveries } = useApp();
  const [viewingDelivery, setViewingDelivery] = useState<any>(null);

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
        <p className="text-gray-500">Monitor and inspect all system transactions and routes.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Route / ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stakeholders</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fee</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Details</th>
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
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">ID: {d.id.slice(0,18)}...</p>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 font-medium text-xs">C:</span>
                    <span className="font-bold text-gray-900">{d.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 font-medium text-xs">D:</span>
                    <span className="font-bold text-[#00B14F]">{d.driver_name || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-gray-900">{formatCurrency(d.delivery_fee)}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{d.payment_method}</p>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(d.delivery_status)}`}>
                    {d.delivery_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setViewingDelivery(d)}
                    className="p-2 text-gray-400 hover:text-[#00B14F] hover:bg-[#00B14F]/10 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveries.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No deliveries recorded yet.</div>}
      </div>

      {/* Details Modal */}
      {viewingDelivery && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00B14F]/10 rounded-xl text-[#00B14F]">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">Delivery Details</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {viewingDelivery.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingDelivery(null)} className="text-gray-400 hover:text-gray-600 p-2"><X size={24} /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Route Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Delivery Route</label>
                  <div className="relative pl-6 space-y-8">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 border-l-2 border-dotted border-gray-200" />
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#00B14F] border-4 border-white shadow-sm" />
                      <p className="text-xs font-bold text-gray-400 uppercase">Pickup</p>
                      <p className="text-sm font-bold text-gray-900">{viewingDelivery.pickup_location}</p>
                      <p className="text-xs text-gray-500 mt-1">{viewingDelivery.sender_name} • {viewingDelivery.sender_phone}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm" />
                      <p className="text-xs font-bold text-gray-400 uppercase">Dropoff</p>
                      <p className="text-sm font-bold text-gray-900">{viewingDelivery.dropoff_location}</p>
                      <p className="text-xs text-gray-500 mt-1">{viewingDelivery.recipient_name} • {viewingDelivery.recipient_phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package & Payment Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Item Information</label>
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{viewingDelivery.item_type || 'Package'}</p>
                      <p className="text-xs text-gray-500">Size: {viewingDelivery.item_size} • {viewingDelivery.item_weight}kg</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Transaction Details</label>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Payment Method</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <CreditCard size={14} className="text-gray-400" />
                        <span className="uppercase">{viewingDelivery.payment_method}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Total Fee</span>
                      <span className="text-lg font-black text-[#00B14F]">{formatCurrency(viewingDelivery.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Booking Time</span>
                      <span className="font-bold text-gray-900">{new Date(viewingDelivery.booking_time).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${viewingDelivery.delivery_status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Status: {viewingDelivery.delivery_status.replace('_', ' ')}</span>
              </div>
              <button 
                onClick={() => setViewingDelivery(null)}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-black/10 hover:bg-black transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
