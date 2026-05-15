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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

    // Simplified Text Validation
    const pParts = pickup.split(',').map(s => s.trim().toLowerCase());
    const dParts = dropoff.split(',').map(s => s.trim().toLowerCase());
    
    // Check if they mention the same city or province
    const commonKeyword = pParts.find(p => dParts.includes(p));
    
    if (!commonKeyword && pParts.length > 1 && dParts.length > 1) {
      setError('Service Boundary Error: Pickup and Drop-off must be within the same city or province.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setBooking({
      pickup_location: pickup,
      dropoff_location: dropoff,
      delivery_fee: 64,
      delivery_status: 'pending'
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
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col relative">
        {/* Invisible overlay to close suggestions when clicking outside */}
        {activeInput && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setActiveInput(null)} 
          />
        )}

        <header className="mb-6 relative z-20">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Create New Delivery</h1>
          <p className="text-[#6b7280]">Tap on the map to set your pickup and drop-off points, or enter them manually.</p>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl font-bold flex items-center gap-3 animate-shake relative z-20">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full relative z-20">
          <div className="space-y-6">
            <form onSubmit={handleConfirm} className="rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00B14F]"></span> Pickup Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="City, Province (e.g. Mandaue, Cebu)"
                    className="grab-input w-full"
                    value={pickup}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      setError(null);
                    }}
                    required
                  />
                </div>

                <div className="flex justify-center py-2">
                  <div className="w-1 h-8 border-l-2 border-dashed border-[#e5e7eb]"></div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded bg-red-400"></span> Drop-off Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="City, Province (e.g. Cebu City, Cebu)"
                    className="grab-input w-full"
                    value={dropoff}
                    onChange={(e) => {
                      setDropoff(e.target.value);
                      setError(null);
                    }}
                    required
                  />
                </div>
              </div>
            </form>

            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#111827] mb-6">Price Summary</h3>
              
              <div className="space-y-4 border-b border-[#e5e7eb] pb-6 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Base Fare</span>
                  <span className="text-[#111827]">₱49.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Service Fee</span>
                  <span className="text-[#111827]">₱15.00</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-[#6b7280] font-medium">Total Estimate</span>
                <span className="text-3xl font-black text-[#00B14F]">₱64.00</span>
              </div>
              
              <button 
                onClick={handleConfirm}
                disabled={!pickup || !dropoff}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg grab-glow ${
                  pickup && dropoff 
                    ? 'bg-[#00B14F] hover:bg-[#009940] text-white shadow-[#00B14F]/20' 
                    : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed shadow-none'
                }`}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
