'use client';
import { Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DriverCard from '@/components/DriverCard';
import StatusTimeline from '@/components/StatusTimeline';
import { DeliveryStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function TrackingByIdPage() {
  const { booking, user, loading, deliveries, fetchDeliveries } = useApp();
  const params = useParams<{ deliveryId: string }>();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  // Verify the delivery exists in the DB directly — avoids race condition
  // where booking state hasn't updated yet right after navigation
  useEffect(() => {
    if (loading) return;
    if (!params.deliveryId) { router.push('/book'); return; }

    const verify = async () => {
      try {
        const { data, error } = await supabase
          .from('deliveries')
          .select('*')
          .eq('id', params.deliveryId)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          console.error("Delivery not found in DB:", params.deliveryId);
          router.push('/book');
        } else {
          setVerified(true);
          await fetchDeliveries();
        }
      } catch (err) {
        console.error("Verification error:", err);
        // Retry once after 2 seconds
        setTimeout(verify, 2000);
      }
    };

    verify();
  }, [params.deliveryId, loading, fetchDeliveries, router]);

  useEffect(() => {
    if (!verified) return;
    // Poll every 2 seconds for real-time status updates
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 2000);
    return () => clearInterval(interval);
  }, [verified, fetchDeliveries]);

  // Find the real status from the database, fallback to booking state
  const currentDelivery = deliveries.find(d => d.id === params.deliveryId);
  const realStatus = currentDelivery?.status || booking.status || 'pending';
  // Use driver from DB delivery or booking state
  const driver = booking.driver || null;

  // ── Mock Location Simulation ──
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (realStatus === 'in_transit') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + 1; // 1% every 200ms = 20 seconds total
        });
      }, 200);
      return () => clearInterval(interval);
    } else if (realStatus === 'delivered') {
      setProgress(100);
    }
  }, [realStatus]);

  if (loading || !verified) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Delivery in Progress</h1>
          <p className="text-[#6b7280]">Real-time status updates for your package.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#111827] mb-8">Tracking Details</h3>
              <StatusTimeline currentStatus={realStatus} />
              
              {/* Mock Location Progress Bar */}
              {(realStatus === 'in_transit' || realStatus === 'delivered') && (
                <div className="mt-10 pt-10 border-t border-[#f3f4f6]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-[#111827]">Current Location (Simulated)</span>
                    <span className="text-sm font-medium text-[#00b14f]">{progress}% to destination</span>
                  </div>
                  <div className="h-3 w-full bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00b14f] transition-all duration-300 ease-linear rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-[#6b7280]">
                    {realStatus === 'delivered' 
                      ? 'Package has arrived!' 
                      : `Driver is currently ${progress < 50 ? 'near the pickup point' : 'en route to the drop-off'}.`}
                  </p>
                </div>
              )}

              {realStatus === 'delivered' && (
                <div className="mt-10 p-6 bg-[var(--grab-green)]/10 border border-[var(--grab-green)]/30 rounded-2xl fade-in">
                  <div className="flex items-center gap-4">
                    <div className="text-[#00B14F]">
                      <Flag size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#111827]">Arrival!</h4>
                      <p className="text-sm text-[#6b7280]">Your package has been delivered to the destination.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest px-1">Your Driver</h3>
              {booking.driver && <DriverCard driver={booking.driver} compact />}
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest">Route Summary</h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--grab-green)] mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="text-[10px] text-[#9ca3af] uppercase font-bold">Pickup</div>
                    <div className="text-sm text-[#111827] font-medium">{booking.pickup}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded bg-red-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="text-[10px] text-[#9ca3af] uppercase font-bold">Drop-off</div>
                    <div className="text-sm text-[#111827] font-medium">{booking.dropoff}</div>
                  </div>
                </div>
              </div>
            </div>

            {realStatus === 'delivered' && (
              <button
                onClick={() => router.push(`/payment/${booking.id}`)}
                className="btn-primary py-4 text-lg font-bold grab-glow w-full fade-in"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
