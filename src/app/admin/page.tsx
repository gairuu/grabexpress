'use client';

import { useApp } from '@/context/AppContext';
import { Users, Truck, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { deliveries } = useApp();

  const totalRevenue = deliveries
    .filter(d => d.delivery_status === 'delivered')
    .reduce((sum, d) => sum + d.delivery_fee, 0);

  const activeDeliveries = deliveries.filter(d => d.delivery_status === 'pending' || d.delivery_status === 'in_transit').length;
  const completedDeliveries = deliveries.filter(d => d.delivery_status === 'delivered').length;

  const stats = [
    { name: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { name: 'Completed Deliveries', value: completedDeliveries, icon: Package, color: 'bg-blue-500' },
    { name: 'Active Requests', value: activeDeliveries, icon: Truck, color: 'bg-yellow-500' },
    { name: 'Total Transactions', value: deliveries.length, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of system activity and performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color} text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <button className="text-sm font-bold text-[#00B14F] hover:underline">View All</button>
        </div>
        <div className="divide-y divide-gray-50">
          {deliveries.slice(0, 5).map((delivery) => (
            <div key={delivery.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{delivery.customer_name}</p>
                  <p className="text-xs text-gray-500 truncate w-48">{delivery.pickup_location} → {delivery.dropoff_location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(delivery.delivery_fee)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  delivery.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' : 
                  delivery.delivery_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {delivery.delivery_status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
          {deliveries.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">No recent activity found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
