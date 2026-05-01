'use client';
import { Box, Users, Bike, Wallet, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { useRouter } from 'next/navigation';

type Tab = 'deliveries' | 'customers' | 'drivers';

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

interface DriverRow {
  id: string;
  vehicle_type: string;
  plate_number: string;
  rating: number;
  is_available: boolean;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('deliveries');
  const { user, loading, deliveries } = useApp();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [drivers, setDrivers] = useState<(DriverRow & { name: string })[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Fetch all profiles
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setProfiles(data);
    });

    // Fetch all drivers with their profile names
    supabase.from('drivers').select('*, profiles(name)').then(({ data }) => {
      if (data) {
        const mapped = data.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          vehicle_type: d.vehicle_type as string,
          plate_number: d.plate_number as string,
          rating: d.rating as number,
          is_available: d.is_available as boolean,
          name: (d.profiles as { name: string })?.name || 'Unknown',
        }));
        setDrivers(mapped);
      }
    });
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth');
    return null;
  }

  if (user.role !== 'admin') {
    if (typeof window !== 'undefined') router.push('/dashboard');
    return null;
  }

  const customers = profiles.filter((p) => p.role === 'customer');

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Admin Control Center</h1>
          <p className="text-[#6b7280]">Manage system-wide deliveries, customers, and drivers.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatsCard icon={Box} label="Total Orders" value={deliveries.length} delay={0} />
          <StatsCard icon={Users} label="Total Customers" value={customers.length} color="#3B82F6" delay={50} />
          <StatsCard icon={Bike} label="Total Drivers" value={drivers.length} color="#FBBF24" delay={100} />
          <StatsCard icon={Wallet} label="Revenue" value={formatCurrency(deliveries.reduce((a, b) => a + b.fee, 0))} color="#00D861" delay={150} />
        </div>

        <div className="mb-8 flex gap-8 overflow-x-auto border-b border-[#d1d5db]">
          <button 
            onClick={() => setActiveTab('deliveries')}
            className={`px-2 pb-4 text-sm font-bold transition-all ${activeTab === 'deliveries' ? 'tab-active' : 'text-[#9ca3af] hover:text-[#111827]'}`}
          >
            Deliveries ({deliveries.length})
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-2 pb-4 text-sm font-bold transition-all ${activeTab === 'customers' ? 'tab-active' : 'text-[#9ca3af] hover:text-[#111827]'}`}
          >
            Customers ({customers.length})
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`px-2 pb-4 text-sm font-bold transition-all ${activeTab === 'drivers' ? 'tab-active' : 'text-[#9ca3af] hover:text-[#111827]'}`}
          >
            Drivers ({drivers.length})
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f9fafb]">
                {activeTab === 'deliveries' && (
                  <tr>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">ID</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Customer</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Driver</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Route</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Status</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest text-right">Fee</th>
                  </tr>
                )}
                {activeTab === 'customers' && (
                  <tr>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Name</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Email</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Phone</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest text-right">Joined</th>
                  </tr>
                )}
                {activeTab === 'drivers' && (
                  <tr>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Driver</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Vehicle</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Plate #</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Rating</th>
                    <th className="p-5 text-xs font-bold text-[#9ca3af] uppercase tracking-widest text-right">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {activeTab === 'deliveries' && deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="p-5 font-mono text-xs text-[#9ca3af]">{d.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-5 text-sm text-[#111827] font-medium">{d.customerName}</td>
                    <td className="p-5 text-sm text-[#6b7280]">{d.driverName}</td>
                    <td className="p-5 text-sm text-[#9ca3af] max-w-xs truncate">{d.pickup} → {d.dropoff}</td>
                    <td className="p-5"><StatusBadge status={d.status} size="sm" /></td>
                    <td className="p-5 text-sm font-bold text-[var(--grab-green)] text-right">{formatCurrency(d.fee)}</td>
                  </tr>
                ))}
                {activeTab === 'deliveries' && deliveries.length === 0 && (
                  <tr><td colSpan={6} className="p-10 text-center text-sm text-[#9ca3af]">No deliveries recorded yet.</td></tr>
                )}
                {activeTab === 'customers' && customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="p-5 text-sm text-[#111827] font-medium">{c.name}</td>
                    <td className="p-5 text-sm text-[#6b7280]">{c.email}</td>
                    <td className="p-5 text-sm text-[#6b7280]">{c.phone || '—'}</td>
                    <td className="p-5 text-sm text-[#9ca3af] text-right">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {activeTab === 'customers' && customers.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-sm text-[#9ca3af]">No customers registered yet.</td></tr>
                )}
                {activeTab === 'drivers' && drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="p-5 text-sm text-[#111827] font-medium">{d.name}</td>
                    <td className="p-5 text-sm text-[#6b7280]">{d.vehicle_type}</td>
                    <td className="p-5 font-mono text-xs text-[#6b7280]">{d.plate_number}</td>
                    <td className="p-5 text-sm text-[#FBBF24] font-bold flex items-center gap-1">
                      <Star size={14} fill="#FBBF24" /> {d.rating}
                    </td>
                    <td className="p-5 text-right">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${d.is_available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {d.is_available ? 'Available' : 'Busy'}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeTab === 'drivers' && drivers.length === 0 && (
                  <tr><td colSpan={5} className="p-10 text-center text-sm text-[#9ca3af]">No drivers registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
