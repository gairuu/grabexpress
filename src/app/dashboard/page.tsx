'use client';
import { useState, useEffect } from 'react';
import { MapPin, Inbox, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import DeliveryCard from '@/components/DeliveryCard';

export default function DashboardPage() {
  const { user, loading, deliveries, clearDeliveries } = useApp();
  const router = useRouter();

  useEffect(() => {
    // If we're still loading the session, do nothing yet
    if (loading) return;

    if (!user) {
      // Small delay to ensure session is truly missing
      const timer = setTimeout(() => {
        router.push('/auth');
      }, 500);
      return () => clearTimeout(timer);
    } else if (user.role === 'driver') {
      router.push('/driver');
    } else if (user.role === 'admin') {
      router.push('/admin');
    }
  }, [user, router, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center">
        <div className="text-[#6b7280]">Loading...</div>
      </div>
    );
  }

  if (!user || user.role === 'driver') {
    return null;
  }

  const topDropoffs = Array.from(new Set(deliveries.map((d) => d.dropoff_location))).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />

      <section className="bg-white border-b border-[#e5e7eb] pb-12 pt-6">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="text-sm font-medium text-[#6b7280]">Welcome back, {user.name}!</div>

          <div className="mt-4 rounded-lg bg-white p-2 shadow-xl">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <button
                onClick={() => router.push('/book')}
                className="flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3 text-left text-sm text-[#6b7280]"
              >
                <span className="h-2 w-2 rounded-full bg-[#2dd4bf]"></span>
                Deliver from...
              </button>
              <button
                onClick={() => router.push('/book')}
                className="flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3 text-left text-sm text-[#6b7280]"
              >
                <span className="h-2 w-2 rounded bg-[#fb7185]"></span>
                Deliver to...
              </button>
              <Link href="/book">
                <button className="rounded-md bg-[#00B14F] px-6 py-3 text-sm font-bold text-white hover:bg-[#009940] transition shadow-lg shadow-[#00B14F]/20">
                  + New Booking
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-4 w-full max-w-6xl px-4 pb-10 md:px-6">
        {/* Quick destinations */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">Deliver to ({topDropoffs.length})</h2>
            <Link href="/book" className="text-sm font-bold text-[#00B14F] hover:underline">
              + New booking
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {topDropoffs.length > 0 ? (
              topDropoffs.map((place) => (
                <button
                  key={place}
                  onClick={() => router.push('/book')}
                  className="flex min-h-16 items-center gap-3 rounded-lg border border-[#e5e7eb] px-3 py-2 text-left transition hover:border-[#99f6e4] hover:bg-[#f0fdfa]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ccfbf1] text-[#00B14F] text-sm">
                    <MapPin size={16} />
                  </div>
                  <div className="line-clamp-2 text-xs text-[#4b5563]">{place}</div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#d1d5db] px-3 py-4 text-sm text-[#6b7280] md:col-span-5">
                No saved destinations yet. Create your first delivery!
              </div>
            )}
          </div>
        </section>

        {/* Recent deliveries */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">Recent Deliveries ({deliveries.length})</h2>
            {deliveries.some(d => d.delivery_status === 'delivered' || d.delivery_status === 'cancelled') && (
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to clear your delivery history? This will remove all completed and cancelled deliveries.')) {
                    await clearDeliveries();
                  }
                }}
                className="flex items-center gap-1 text-sm font-medium text-[#6b7280] hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
                Clear History
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.length > 0 ? (
              deliveries.map((delivery, index) => (
                <DeliveryCard key={delivery.id} delivery={delivery} delay={index * 50} />
              ))
            ) : (
              <div className="col-span-2 rounded-xl border border-dashed border-[#d1d5db] bg-white p-12 text-center shadow-sm">
                <div className="mb-4 flex justify-center text-[#d1d5db]">
                  <Inbox size={48} strokeWidth={1} />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">No deliveries yet</h3>
                <p className="text-sm text-[#6b7280] mb-6">Create your first delivery to see it here!</p>
                <Link href="/book">
                  <button className="rounded-md bg-[#00B14F] px-8 py-3 text-sm font-bold text-white hover:bg-[#009940] grab-glow">
                    Book Now
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
