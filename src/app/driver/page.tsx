'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import ChatBox from '@/components/ChatBox';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, Truck, CheckCircle2, Package, Bell, MapPin, X } from 'lucide-react';
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
  const [incomingJob, setIncomingJobState] = useState<any>(null);
  const incomingJobRef = useRef<any>(null);

  const setIncomingJob = (job: any) => {
    setIncomingJobState(job);
    incomingJobRef.current = job;
  };

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
        setIncomingJob(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'deliveries',
      }, (payload) => {
        // If the job we are currently showing gets matched or cancelled, hide it
        const currentJob = incomingJobRef.current;
        if (currentJob && payload.new.id === currentJob.id) {
          if (payload.new.broadcast_status !== 'searching' || payload.new.delivery_status === 'cancelled') {
            setIncomingJob(null);
          }
        }
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
      setSelectedDeliveryId(incomingJob.id);
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

  const handleStatusUpdate = async (id: string, status: 'in_transit' | 'arrived' | 'delivered' | 'cancelled') => {
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
  const selectedDelivery = myJobs.find(j => j.id === selectedDeliveryId) || (myJobs.length > 0 ? myJobs[0] : null);

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
        {actionError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
            ⚠️ {actionError}
          </div>
        )}

        {/* Incoming Job Modal */}
        {incomingJob && myJobs.length === 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-[#00B14F] p-6 text-white text-center relative">
                <div className="absolute top-4 right-4">
                  <button onClick={() => setIncomingJob(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Bell size={32} />
                </div>
                <h2 className="text-xl font-bold">New Delivery Available!</h2>
                <p className="text-white/80 text-sm">Action required: Accept or decline job</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00B14F] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{incomingJob.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded bg-red-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Drop-off</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{incomingJob.dropoff_location}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-2xl font-black text-[#00B14F]">{formatCurrency(incomingJob.delivery_fee)}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">{incomingJob.vehicle_type}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIncomingJob(null)}
                    className="py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={handleAcceptJob}
                    className="py-4 rounded-xl bg-[#00B14F] text-white font-bold hover:bg-[#009940] transition-colors shadow-lg shadow-[#00B14F]/20"
                  >
                    Accept Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE MISSION MODE: If driver has an active job, lock them into it */}
        {myJobs.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-[#111827] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00B14F]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#00B14F] p-2 rounded-xl">
                    <Truck size={24} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Active Mission In Progress</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#00B14F] mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pickup</p>
                          <p className="text-lg font-medium">{myJobs[0].pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded bg-red-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Drop-off</p>
                          <p className="text-lg font-medium">{myJobs[0].dropoff_location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4">
                       <div className="bg-white/5 rounded-2xl px-5 py-3 border border-white/10">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Fee</p>
                          <p className="text-xl font-black text-[#00B14F]">{formatCurrency(myJobs[0].delivery_fee)}</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl px-5 py-3 border border-white/10">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                          <StatusBadge status={myJobs[0].delivery_status} />
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end space-y-4">
                    {myJobs[0].delivery_status === 'pending' ? (
                      <button 
                        onClick={() => handleStatusUpdate(myJobs[0].id, 'in_transit')}
                        className="w-full py-5 bg-[#00B14F] text-white rounded-2xl font-black text-lg hover:bg-[#009940] transition-all shadow-xl shadow-[#00B14F]/20"
                        disabled={loadingId === myJobs[0].id}
                      >
                        {loadingId === myJobs[0].id ? 'Processing...' : 'START DELIVERY'}
                      </button>
                    ) : myJobs[0].delivery_status === 'in_transit' ? (
                      <button 
                        onClick={() => handleStatusUpdate(myJobs[0].id, 'arrived')}
                        className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
                        disabled={loadingId === myJobs[0].id}
                      >
                        {loadingId === myJobs[0].id ? 'Processing...' : 'I HAVE ARRIVED'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleStatusUpdate(myJobs[0].id, 'delivered')}
                          className={`w-full py-5 text-white rounded-2xl font-black text-lg transition-all shadow-xl ${
                            myJobs[0].payment_status === 'paid' 
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                              : 'bg-gray-700 opacity-50 cursor-not-allowed'
                          }`}
                          disabled={loadingId === myJobs[0].id || myJobs[0].payment_status === 'unpaid'}
                        >
                          {loadingId === myJobs[0].id ? 'Processing...' : 'MARK AS DELIVERED'}
                        </button>
                        {myJobs[0].payment_status === 'unpaid' && (
                          <p className="text-xs text-center text-yellow-500 font-bold animate-pulse">
                            ⚠️ Awaiting Customer Payment...
                          </p>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => handleStatusUpdate(myJobs[0].id, 'cancelled')}
                      className="w-full py-3 text-white/40 text-sm font-bold hover:text-red-400 transition-colors"
                      disabled={loadingId === myJobs[0].id}
                    >
                      Emergency Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-gray-400 text-sm italic">
               <Bell size={14} />
               You must finish your current job before accepting new requests.
            </div>
          </div>
        ) : (
          /* JOB SEARCH MODE: Stats and idle state */
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatsCard icon={Clock} label="Pending Pickups" value={stats.pending} />
              <StatsCard icon={Truck} label="In Transit" value={stats.active} color="#3B82F6" />
              <StatsCard icon={CheckCircle2} label="Completed Today" value={stats.completed} color="#00B14F" />
            </section>

            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                {driverStatus === 'available' ? (
                  <div className="animate-ping w-8 h-8 bg-green-400 rounded-full opacity-75"></div>
                ) : (
                  <Clock size={40} strokeWidth={1.5} />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {driverStatus === 'available' ? 'Searching for jobs...' : 'You are currently Offline'}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  {driverStatus === 'available' 
                    ? 'Stay on this page to receive real-time delivery alerts for your vehicle type.' 
                    : 'Switch your status to Online to start receiving delivery requests.'}
                </p>
              </div>
              {driverStatus === 'offline' && (
                <button 
                  onClick={toggleAvailability}
                  className="mt-6 px-8 py-3 bg-[#00B14F] text-white rounded-xl font-bold hover:bg-[#009940] transition-all"
                >
                  Go Online
                </button>
              )}
            </div>
          </div>
        )}
        {selectedDelivery && (
          <ChatBox 
            deliveryId={selectedDelivery.id} 
            recipientName={selectedDelivery.customer_name} 
          />
        )}
      </main>
    </div>
  );
}
