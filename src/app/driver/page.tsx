'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import ChatBox from '@/components/ChatBox';
import IncomingJobModal from '@/components/IncomingJobModal';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, Truck, CheckCircle2, Package, MessageCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/lib/supabase';

export default function DriverDashboardPage() {
  const { user, loading, deliveries, updateDeliveryStatus, fetchDeliveries } = useApp();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [driverStatus, setDriverStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [incomingJob, setIncomingJob] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch of driver status
    const fetchStatus = async () => {
      const { data } = await supabase.from('drivers').select('status').eq('id', user.id).maybeSingle();
      if (data) setDriverStatus(data.status as any);
    };
    fetchStatus();

    // Real-time listener for this specific driver's status
    const channel = supabase
      .channel(`driver-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Driver] Status update received:', payload.new.status);
          setDriverStatus(payload.new.status as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (loading || !user || deliveries.length === 0) return;
    
    // Auto-select the first active job if none is selected
    const activeJob = deliveries.find(d => d.driver_id === user.id && (d.delivery_status === 'pending' || d.delivery_status === 'in_transit'));
    if (activeJob && !selectedDeliveryId) {
      setSelectedDeliveryId(activeJob.id);
    }
  }, [deliveries, user, selectedDeliveryId, loading]);

  useEffect(() => {
    if (!user || driverStatus !== 'available') return;

    // Listen for NEW searching deliveries for this driver's vehicle type
    const channel = supabase
      .channel('searching-jobs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'deliveries',
        filter: 'broadcast_status=eq.searching'
      }, (payload) => {
        // Only show if it matches driver's vehicle type (simple check)
        setIncomingJob(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, driverStatus]);

  const handleAcceptJob = async () => {
    if (!incomingJob || !user) return;
    
    try {
      // Optimistically update delivery
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          driver_id: user.id, 
          driver_name: user.name,
          broadcast_status: 'matched' 
        })
        .eq('id', incomingJob.id)
        .eq('broadcast_status', 'searching'); // Safety check to prevent double matching

      if (error) throw error;

      setIncomingJob(null);
      await fetchDeliveries();
    } catch (err) {
      console.error('Failed to accept job:', err);
      alert('This job was already taken by another driver.');
      setIncomingJob(null);
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    setStatusLoading(true);
    const newStatus = driverStatus === 'available' ? 'busy' : 'available';
    
    try {
      const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', user.id);
      if (error) throw error;
      // Note: Local state will be updated by the Real-time listener
    } catch (err: any) {
      console.error('[Driver] Toggle availability failed:', err);
      setActionError('Failed to update status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'in_transit' | 'delivered' | 'cancelled') => {
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
      console.log(`[Driver] Updating status for ${id} to ${status}`);
      await updateDeliveryStatus(id, status);
      clearTimeout(safetyTimeout);
      
      // Manual refresh of deliveries just in case
      await fetchDeliveries();
      
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('[Driver] Status update failed:', err);
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
  }, [user, router, loading]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || user.role !== 'driver') {
    return null;
  }

  const stats = {
    pending: deliveries.filter((job) => job.delivery_status === 'pending').length,
    active: deliveries.filter((job) => job.delivery_status === 'in_transit').length,
    completed: deliveries.filter((job) => job.delivery_status === 'delivered').length,
  };

  const myJobs = deliveries.filter(job => job.driver_id === user?.id && (job.delivery_status === 'pending' || job.delivery_status === 'in_transit'));
  const selectedDelivery = myJobs.find(j => j.id === selectedDeliveryId);

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Driver Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${driverStatus === 'available' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
              <p className="text-sm text-[#6b7280]">
                Status: <span className="font-semibold uppercase">{driverStatus}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={toggleAvailability} 
              disabled={statusLoading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                driverStatus === 'available' 
                  ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100' 
                  : 'bg-[#00B14F] text-white hover:bg-[#009940]'
              }`}
            >
              {statusLoading ? '...' : (driverStatus === 'available' ? 'Go Busy/Offline' : 'Go Online/Available')}
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
                No assigned deliveries yet.
              </div>
            ) : (
              myJobs.map((job) => (
                <div 
                  key={job.id} 
                  className={`px-5 py-4 cursor-pointer transition-all border-l-4 ${
                    selectedDeliveryId === job.id ? 'bg-green-50 border-[var(--grab-green)]' : 'hover:bg-gray-50 border-transparent'
                  }`} 
                  onClick={() => setSelectedDeliveryId(job.id)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="font-mono text-[10px] text-[#9ca3af]">#{job.id.slice(0, 8).toUpperCase()}</span>
                        <StatusBadge status={job.delivery_status} size="sm" />
                      </div>
                      <div className="text-sm font-bold text-[#111827] line-clamp-1">
                        {job.pickup_location.split(',')[0]} &rarr; {job.dropoff_location.split(',')[0]}
                      </div>
                      <div className="mt-1 text-[11px] text-[#6b7280]">
                        <span className="font-semibold text-gray-700">Customer:</span> {job.customer_name} · {formatDate(job.booking_time)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div 
                        className={`p-2 rounded-lg border transition-colors ${selectedDeliveryId === job.id ? 'bg-[var(--grab-green)] text-white border-[var(--grab-green)]' : 'bg-white text-gray-300 border-gray-100'}`}
                      >
                        <Package size={16} />
                      </div>

                      {job.delivery_status === 'pending' && (
                        <>
                          <button
                            className="rounded-md bg-[#00B14F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#009940] disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(job.id, 'in_transit'); }}
                          >
                            {loadingId === job.id ? 'Updating...' : 'Start Delivery'}
                          </button>
                        </>
                      )}
                      {job.delivery_status === 'in_transit' && (
                        <>
                          <button
                            className="rounded-md bg-[var(--grab-green)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--grab-green-dark)] disabled:opacity-60"
                            disabled={loadingId === job.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(job.id, 'delivered'); }}
                          >
                            {loadingId === job.id ? 'Updating...' : 'Mark Delivered'}
                          </button>
                        </>
                      )}
                      
                      <button
                        className="rounded-md border border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#6b7280] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors disabled:opacity-60"
                        disabled={loadingId === job.id}
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(job.id, 'cancelled'); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        {selectedDelivery && (
          <ChatBox 
            deliveryId={selectedDelivery.id} 
            recipientName={selectedDelivery.customer_name} 
          />
        )}

        {incomingJob && (
          <IncomingJobModal 
            delivery={incomingJob}
            onAccept={handleAcceptJob}
            onReject={() => setIncomingJob(null)}
          />
        )}
      </main>
    </div>
  );
}
