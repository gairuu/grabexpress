'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Shield, CheckCircle, XCircle, Edit2, Trash2, X } from 'lucide-react';

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicense, setEditLicense] = useState('');

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

  async function deleteDriver(driverId: string) {
    if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) return;
    
    // Profiles table has ON DELETE CASCADE for drivers, but we delete profile to remove both
    const { error } = await supabase.from('profiles').delete().eq('id', driverId);
    if (!error) {
      setDrivers(drivers.filter(d => d.id !== driverId));
    } else {
      alert('Error deleting driver: ' + error.message);
    }
  }

  async function updateDriver() {
    if (!editingDriver) return;

    // Update profile
    const { error: pError } = await supabase
      .from('profiles')
      .update({ name: editName, contact_number: editPhone })
      .eq('id', editingDriver.id);

    // Update driver info
    const { error: dError } = await supabase
      .from('drivers')
      .update({ license_number: editLicense })
      .eq('id', editingDriver.id);

    if (!pError && !dError) {
      setEditingDriver(null);
      fetchDrivers();
    } else {
      alert('Error updating driver: ' + (pError?.message || dError?.message));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Drivers</h1>
          <p className="text-gray-500">Edit, delete, or toggle availability for all registered drivers.</p>
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
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">License</th>
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
                      <p className="text-[10px] text-gray-400">{d.contact_number || d.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 font-mono uppercase">{d.drivers?.[0]?.license_number || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{d.drivers?.[0]?.vehicle_type || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">{d.drivers?.[0]?.plate_number || 'No Plate'}</p>
                </td>
                <td className="px-6 py-4">
                   <button 
                    onClick={() => toggleStatus(d.id, d.drivers?.[0]?.is_available)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    d.drivers?.[0]?.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                    {d.drivers?.[0]?.is_available ? 'Available' : 'Busy'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingDriver(d);
                        setEditName(d.name);
                        setEditPhone(d.contact_number || '');
                        setEditLicense(d.drivers?.[0]?.license_number || '');
                      }}
                      className="p-2 text-gray-400 hover:text-[#00B14F] hover:bg-[#00B14F]/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteDriver(d.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center text-gray-400 text-sm">Loading drivers...</div>}
        {!loading && drivers.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No drivers found.</div>}
      </div>

      {/* Edit Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg">Edit Driver</h3>
              <button onClick={() => setEditingDriver(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input type="text" className="grab-input w-full" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input type="text" className="grab-input w-full" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">License Number</label>
                <input type="text" className="grab-input w-full" value={editLicense} onChange={e => setEditLicense(e.target.value)} />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setEditingDriver(null)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={updateDriver} className="flex-2 px-8 py-3 bg-[#00B14F] text-white rounded-xl font-bold shadow-lg shadow-[#00B14F]/20 hover:bg-[#009940] transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
