'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { calculateFee, formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Map from '@/components/Map';

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export default function BookDeliveryPage() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  const { user, loading, setBooking } = useApp();
  const router = useRouter();

  let fee = 0;
  let distanceStr = '';
  if (pickupCoords && dropoffCoords) {
    const distanceKm = calculateDistanceKM(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
    distanceStr = `(${distanceKm.toFixed(1)} km)`;
    fee = 49 + Math.max(0, distanceKm - 1) * 15; // 49 base + 15 per km after 1st km
  } else if (pickup && dropoff) {
    fee = calculateFee(pickup, dropoff);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
    } else if (user.role === 'driver') {
      router.push('/driver');
    }
  }, [user, router, loading]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!pickupCoords) {
      setPickupCoords([lat, lng]);
      setPickup(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    } else if (!dropoffCoords) {
      setDropoffCoords([lat, lng]);
      setDropoff(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    } else {
      // Reset if both exist and user clicks again
      setPickupCoords([lat, lng]);
      setPickup(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      setDropoffCoords(null);
      setDropoff('');
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setBooking({
      id: crypto.randomUUID(),
      pickup_location: pickup,
      dropoff_location: dropoff,
      delivery_fee: fee,
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

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Create New Delivery</h1>
          <p className="text-[#6b7280]">Tap on the map to set your pickup and drop-off points, or enter them manually.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
          {/* Left Column: Form & Price Summary */}
          <div className="space-y-6 flex flex-col">
            <form onSubmit={handleConfirm} className="rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00B14F]"></span> Pickup Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where are we picking up from?"
                    className="grab-input"
                    value={pickup}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      if (pickupCoords) setPickupCoords(null); // Clear coords if user types manually
                    }}
                    required
                  />
                </div>

                <div className="flex justify-center py-2">
                  <div className="w-1 h-8 border-l-2 border-dashed border-[#e5e7eb]"></div>
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
                    onChange={(e) => {
                      setDropoff(e.target.value);
                      if (dropoffCoords) setDropoffCoords(null); // Clear coords if user types manually
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
                  <span className="text-[#6b7280]">Distance Fee {distanceStr}</span>
                  <span className="text-[#111827]">{fee > 0 ? formatCurrency(fee - 49) : '₱0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Insurance</span>
                  <span className="text-[#00B14F]">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-4">
                <span className="text-[#6b7280] font-medium">Total Estimate</span>
                <span className="text-3xl font-black text-[#00B14F]">{formatCurrency(fee)}</span>
              </div>
              
              <p className="text-[#9ca3af] text-[10px] uppercase tracking-wider text-center mb-6">
                Prices may vary during peak hours
              </p>

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

          {/* Right Column: Interactive Map */}
          <div className="min-h-[400px] lg:min-h-full rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col relative z-0">
            <div className="p-4 border-b border-[#e5e7eb] bg-gray-50 flex justify-between items-center z-10">
              <span className="text-sm font-bold text-[#111827]">Interactive Map</span>
              <button 
                onClick={() => { setPickupCoords(null); setDropoffCoords(null); setPickup(''); setDropoff(''); }}
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Clear Map
              </button>
            </div>
            <div className="flex-1 w-full h-full relative z-0">
               <Map 
                pickup={pickupCoords} 
                dropoff={dropoffCoords} 
                onMapClick={handleMapClick} 
                interactive={true} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
