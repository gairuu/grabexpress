'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { calculateFee, formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Map from '@/components/Map';
import { supabase } from '@/lib/supabase';

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

  // Suggestion state
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);

  const { user, loading, setBooking } = useApp();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(30);
  const [currentDeliveryId, setCurrentDeliveryId] = useState<string | null>(null);
  const [error, setError] = useState('');
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

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(',').trim(); 
      }
    } catch (e) {
      console.warn('Reverse geocoding failed', e);
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      return await res.json();
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!pickupCoords && pickup.length > 3 && pickup !== 'Locating...' && activeInput === 'pickup') {
        const data = await fetchSuggestions(pickup);
        setPickupSuggestions(data || []);
      } else {
        setPickupSuggestions([]);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [pickup, pickupCoords, activeInput]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!dropoffCoords && dropoff.length > 3 && dropoff !== 'Locating...' && activeInput === 'dropoff') {
        const data = await fetchSuggestions(dropoff);
        setDropoffSuggestions(data || []);
      } else {
        setDropoffSuggestions([]);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [dropoff, dropoffCoords, activeInput]);

  const handleSuggestionClick = (type: 'pickup' | 'dropoff', suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const address = suggestion.display_name.split(',').slice(0, 3).join(',').trim();

    if (type === 'pickup') {
      setPickup(address);
      setPickupCoords([lat, lon]);
      setPickupSuggestions([]);
      setActiveInput(null);
    } else {
      setDropoff(address);
      setDropoffCoords([lat, lon]);
      setDropoffSuggestions([]);
      setActiveInput(null);
    }
  };

  useEffect(() => {
    if (!isSearching || !currentDeliveryId) return;

    const timer = setInterval(() => {
      setSearchTimer(t => {
        if (t <= 1) {
          setIsSearching(false);
          setError('No drivers accepted your request.');
          return 30;
        }
        return t - 1;
      });
    }, 1000);

    const channel = supabase
      .channel(`matching-${currentDeliveryId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'deliveries',
        filter: `id=eq.${currentDeliveryId}`
      }, (payload) => {
        if (payload.new.broadcast_status === 'matched') {
          router.push(`/tracking/${currentDeliveryId}`);
        }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [isSearching, currentDeliveryId, router]);

  const handleMapClick = async (lat: number, lng: number) => {
    setActiveInput(null); // Close any open suggestion boxes
    if (!pickupCoords) {
      setPickupCoords([lat, lng]);
      setPickup('Locating...');
      const address = await reverseGeocode(lat, lng);
      setPickup(address);
    } else if (!dropoffCoords) {
      setDropoffCoords([lat, lng]);
      setDropoff('Locating...');
      const address = await reverseGeocode(lat, lng);
      setDropoff(address);
    } else {
      setPickupCoords([lat, lng]);
      setPickup('Locating...');
      const address = await reverseGeocode(lat, lng);
      setPickup(address);
      setDropoffCoords(null);
      setDropoff('');
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff || !user) return;

    try {
      const { bookAndMatch } = useApp(); // Correct way to get the function
      
      const deliveryData = {
        customer_id: user.id,
        customer_name: user.name,
        driver_id: '',
        driver_name: 'Unassigned',
        pickup_location: pickup,
        dropoff_location: dropoff,
        delivery_status: 'pending' as const,
        delivery_fee: fee,
        payment_method: 'cash' as const,
        booking_time: new Date().toISOString(),
        estimated_time: '',
        sender_name: '',
        sender_phone: '',
        recipient_name: '',
        recipient_phone: '',
        item_size: 'S' as const,
        item_weight: 1,
        item_type: 'Documents',
        vehicle_type: 'Motorcycle' as const
      };

      const deliveryId = await bookAndMatch(deliveryData);

      setCurrentDeliveryId(deliveryId);
      setIsSearching(true);
      setSearchTimer(30);
    } catch (err: any) {
      setError(err.message);
    }
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

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setBooking({
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


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 relative z-20">
          {/* Left Column: Form & Price Summary */}
          <div className="space-y-6 flex flex-col">
            <form onSubmit={handleConfirm} className="rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-[#6b7280] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00B14F]"></span> Pickup Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where are we picking up from?"
                    className="grab-input w-full"
                    value={pickup}
                    onFocus={() => setActiveInput('pickup')}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      if (pickupCoords) setPickupCoords(null);
                      setActiveInput('pickup');
                    }}
                    required
                  />
                  {pickupSuggestions.length > 0 && activeInput === 'pickup' && (
                    <ul className="absolute z-50 w-full bg-white border border-[#e5e7eb] rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto">
                      {pickupSuggestions.map((s, i) => (
                        <li 
                          key={i} 
                          onClick={() => handleSuggestionClick('pickup', s)}
                          className="px-4 py-3 hover:bg-[#00B14F]/10 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-[#1f2937] transition-colors"
                        >
                          <div className="font-semibold text-[#111827]">{s.display_name.split(',')[0]}</div>
                          <div className="text-xs text-[#6b7280] truncate">{s.display_name.split(',').slice(1).join(',')}</div>
                        </li>
                      ))}
                    </ul>
                  )}
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
                    placeholder="Where are we heading?"
                    className="grab-input w-full"
                    value={dropoff}
                    onFocus={() => setActiveInput('dropoff')}
                    onChange={(e) => {
                      setDropoff(e.target.value);
                      if (dropoffCoords) setDropoffCoords(null);
                      setActiveInput('dropoff');
                    }}
                    required
                  />
                  {dropoffSuggestions.length > 0 && activeInput === 'dropoff' && (
                    <ul className="absolute z-50 w-full bg-white border border-[#e5e7eb] rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto">
                      {dropoffSuggestions.map((s, i) => (
                        <li 
                          key={i} 
                          onClick={() => handleSuggestionClick('dropoff', s)}
                          className="px-4 py-3 hover:bg-[#00B14F]/10 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-[#1f2937] transition-colors"
                        >
                          <div className="font-semibold text-[#111827]">{s.display_name.split(',')[0]}</div>
                          <div className="text-xs text-[#6b7280] truncate">{s.display_name.split(',').slice(1).join(',')}</div>
                        </li>
                      ))}
                    </ul>
                  )}
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
