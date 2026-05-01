'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { calculateFee, formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';

export default function BookDeliveryPage() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const { user, loading, setBooking } = useApp();
  const router = useRouter();
  const fee = pickup && dropoff ? calculateFee(pickup, dropoff) : 0;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
    } else if (user.role === 'driver') {
      router.push('/driver');
    }
  }, [user, router, loading]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setBooking({
      id: crypto.randomUUID(),
      pickup,
      dropoff,
      fee,
      status: 'pending'
    });
    
    router.push('/book/details');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || user.role === 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-8">
            <header>
              <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Create New Delivery</h1>
              <p className="text-[#6b7280]">Enter details to get an instant quote.</p>
            </header>

            <form onSubmit={handleConfirm} className="rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--grab-green)]"></span> Pickup Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where are we picking up from?"
                    className="grab-input"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-center py-2">
                  <div className="w-1 h-8 border-l-2 border-dashed border-[var(--border-subtle)]"></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded bg-red-400"></span> Drop-off Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where are we heading?"
                    className="grab-input"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary py-4 text-lg font-bold" disabled={!pickup || !dropoff}>
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 sticky top-24 shadow-sm">
              <h3 className="text-lg font-bold text-[#111827] mb-6">Price Summary</h3>
              
              <div className="space-y-4 border-b border-[var(--border-subtle)] pb-6 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Base Fare</span>
                  <span className="text-[#111827]">₱49.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Distance Fee</span>
                  <span className="text-[#111827]">{fee > 0 ? formatCurrency(fee - 49) : '₱0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Insurance</span>
                  <span className="text-[var(--grab-green)]">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-4">
                <span className="text-[var(--text-secondary)] font-medium">Total Estimate</span>
                <span className="text-3xl font-black text-[var(--grab-green)]">{formatCurrency(fee)}</span>
              </div>
              
              <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider text-center">
                Prices may vary during peak hours
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
