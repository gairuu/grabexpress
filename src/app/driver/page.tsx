'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, Truck, CheckCircle2, Package } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/lib/supabase';

export default function DriverDashboardPage() {
  const { user, loading, deliveries, updateDeliveryStatus, fetchDeliveries } = useApp();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [driverStatus, setDriverStatus] = useState<{is_available: boolean} | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      const { data } = await supabase.from('drivers').select('is_available').eq('id', user.id).maybeSingle();
      if (data) setDriverStatus(data);
    };
    fetchStatus();
  }, [user]);

  const toggleAvailability = async () => {
    if (!user || !driverStatus) return;
    setStatusLoading(true);
    const newStatus = !driverStatus.is_available;
    const { error } = await supabase.from('drivers').update({ is_available: newStatus }).eq('id', user.id);
    if (!error) setDriverStatus({ is_available: newStatus });
    setStatusLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: 'in_transit' | 'delivered' | 'cancelled') => {
    // If cancelling, ask for confirmation
    if (status === 'cancelled' && !confirm('Are you sure you want to cancel this delivery?')) {
      return;
    }
    
    setLoadingId(id);
    setActionError(null);

    const safetyTimeout = setTimeout(() => {
      setLoadingId(null);
      setActionError('The update is taking longer than expected. Please check your connection.');
    }, 12000);

    try {
      await updateDeliveryStatus(id, status);
      clearTimeout(safetyTimeout);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      setActionError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
    } else if (user.role !== 'driver') {
      router.push('/dashboard');
    }

    // We now have Realtime subscription in AppContext, so we don't need aggressive polling anymore.
    // fetchDeliveries is called once on mount by AppContext.
  }, [user, router, loading, fetchDeliveries]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || user.role !== 'driver') {
    return null;
  }

  const stats = {
    pending: deliveries.filter((job) => job.status === 'pending').length,
    active: deliveries.filter((job) => job.status === 'in_transit').length,
    completed: deliveries.filter((job) => job.status === 'delivered').length,
  };

  // Only show active jobs in the main list
  const myJobs = deliveries.filter(job => job.driverId === user?.id && (job.status === 'pending' || job.status === 'in_transit'));

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Driver Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${driverStatus?.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <p className="text-sm text-[#6b7280]">
                Status: <span className="font-semibold">{driverStatus?.is_available ? 'Online & Available' : 'Offline'}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={toggleAvailability} 
              disabled={statusLoading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                driverStatus?.is_available 
                  ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100' 
                  : 'bg-[#00B14F] text-white hover:bg-[#009940]'
              }`}
            >
              {statusLoading ? '...' : (driverStatus?.is_available ? 'Go Offline' : 'Go Online')}
            </button>
            <button 
              onClick={() => fetchDeliveries()} 
              className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-gray-50 shadow-sm"
            >
              <Clock size={16} />
              Refresh
            </button>
          </div>
        </header>

        {actionError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
            ⚠️ {actionError}
          </div>
        )}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard icon={Clock} label="Pending Pickups" value={stats.pending} />
          <StatsCard icon={Truck} label="In Transit" value={stats.active} color="#3B82F6" />
          <StatsCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#00B14F" />
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">Assigned Deliveries</h2>
          </div>

          <div className="divide-y divide-[#e5e7eb]">
            {myJobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#9ca3af]">
                No assigned deliveries yet. Deliveries will appear here when customers assign you as their driver.
              </div>
            ) : (
              myJobs.map((job) => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="font-mono text-xs text-[#9ca3af]">#{job.id.slice(0, 8).toUpperCase()}</span>
                        <StatusBadge status={job.status} size="sm" />
                      </div>
                      <div className="text-sm font-medium text-[#111827]">
                        {job.pickup} &rarr; {job.dropoff}
                      </div>
                      <div className="mt-1 text-xs text-[#6b7280]">
                        Customer: {job.customerName} · {formatDate(job.createdAt)} · {formatCurrency(job.fee)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'pending' && (
                        <>
                          <button
                            className="rounded-md bg-[#00B14F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#009940] disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={() => handleStatusUpdate(job.id, 'in_transit')}
                          >
                            {loadingId === job.id ? 'Updating...' : 'Start Delivery'}
                          </button>
                          <button
                            className="rounded-md border border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#6b7280] hover:bg-gray-50 disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={() => handleStatusUpdate(job.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {job.status === 'in_transit' && (
                        <>
                          <button
                            className="rounded-md bg-[var(--grab-green)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--grab-green-dark)] disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={() => handleStatusUpdate(job.id, 'delivered')}
                          >
                            {loadingId === job.id ? 'Updating...' : 'Mark Delivered'}
                          </button>
                          <button
                            className="rounded-md border border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#6b7280] hover:bg-gray-50 disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={() => handleStatusUpdate(job.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
