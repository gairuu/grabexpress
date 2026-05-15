'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Truck, Shield, Trash2, Edit, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDriversPage() {
  const { user, deleteUser } = useApp();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          status,
          vehicle_type,
          plate_number,
          rating,
          profiles (
            name,
            email,
            contact_number
          )
        `);

      if (error) throw error;
      setDrivers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver? This will remove their driver record and profile.')) return;
    try {
      await deleteUser(id);
      setDrivers(drivers.filter(d => d.id !== id));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading drivers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Drivers</h1>
          <p className="text-gray-500">Control driver status and system access.</p>
        </div>
        <button className="btn-primary py-2 px-4 text-sm font-bold">+ Add New Driver</button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Driver Info</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Vehicle</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Rating</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      {driver.profiles?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{driver.profiles?.name}</p>
                      <p className="text-xs text-gray-500">{driver.profiles?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{driver.vehicle_type}</p>
                  <p className="text-xs text-gray-500 font-mono">{driver.plate_number}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    driver.status === 'available' ? 'bg-green-100 text-green-700' : 
                    driver.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${driver.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                    <span className="text-yellow-400 text-lg">★</span>
                    {driver.rating.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#00B14F] hover:bg-[#00B14F]/5 rounded-lg transition-all">
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(driver.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                  No drivers registered in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
