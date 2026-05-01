'use client';
import { Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DriverCard from '@/components/DriverCard';
import StatusTimeline from '@/components/StatusTimeline';
import { DeliveryStatus } from '@/lib/types';

export default function TrackingByIdPage() {
  const { booking, setBooking, user, loading } = useApp();
  const params = useParams<{ deliveryId: string }>();
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<DeliveryStatus>(booking.status || 'pending');

  useEffect(() => {
    if (loading) return;
    if (!booking.driver || !booking.id || booking.id !== params.deliveryId) {
      router.push('/book');
      return;
    }

    const pendingToTransit = setTimeout(() => {
      setLocalStatus('in_transit');
      setBooking({ status: 'in_transit' });
    }, 3000);

    const transitToDelivered = setTimeout(() => {
      setLocalStatus('delivered');
      setBooking({ status: 'delivered' });
    }, 9000);

    return () => {
      clearTimeout(pendingToTransit);
      clearTimeout(transitToDelivered);
    };
  }, [booking.driver, booking.id, params.deliveryId, router, setBooking, loading]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || !booking.driver) {
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
              <StatusTimeline currentStatus={localStatus} />

              {localStatus === 'delivered' && (
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
              <DriverCard driver={booking.driver} compact />
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

            {localStatus === 'delivered' && (
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
