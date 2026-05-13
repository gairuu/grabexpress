'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, drivers(*)')
      .eq('role', 'driver');
    
    if (!error && data) {
      setDrivers(data);
    }
    setLoading(false);
  }

  async function toggleStatus(driverId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('drivers')
      .update({ is_available: !currentStatus })
      .eq('id', driverId);
    
    if (!error) {
      fetchDrivers();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Drivers</h1>
          <p className="text-gray-500">View and manage all registered drivers in the system.</p>
        </div>
        <button onClick={fetchDrivers} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
          Refresh List
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00B14F] flex items-center justify-center text-white font-bold text-xs">
                      {d.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{d.name}</p>
                      <p className="text-[10px] text-gray-400">{d.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{d.contact_number || 'No phone'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{d.drivers?.[0]?.vehicle_type || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">{d.drivers?.[0]?.plate_number || 'No Plate'}</p>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    d.drivers?.[0]?.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {d.drivers?.[0]?.is_available ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {d.drivers?.[0]?.is_available ? 'Available' : 'Busy/Offline'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toggleStatus(d.id, d.drivers?.[0]?.is_available)}
                    className="text-xs font-bold text-[#00B14F] hover:underline"
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center text-gray-400 text-sm">Loading drivers...</div>}
        {!loading && drivers.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No drivers found.</div>}
      </div>
    </div>
  );
}
