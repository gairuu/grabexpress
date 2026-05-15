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
  const [pickupProvince, setPickupProvince] = useState<string | null>(null);
  const [dropoffProvince, setDropoffProvince] = useState<string | null>(null);
  const [pickupCountry, setPickupCountry] = useState<string | null>(null);
  const [dropoffCountry, setDropoffCountry] = useState<string | null>(null);

  // Suggestion state
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const reverseGeocode = async (lat: number, lng: number): Promise<{address: string, province: string | null, country: string | null}> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const province = data.address.province || data.address.state || data.address.region || data.address.county || null;
        const country = data.address.country || null;
        return { 
          address: parts.slice(0, 3).join(',').trim(), 
          province,
          country
        }; 
      }
    } catch (e) {
      console.warn('Reverse geocoding failed', e);
    }
    return { address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, province: null, country: null };
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
    const province = suggestion.address.province || suggestion.address.state || suggestion.address.region || suggestion.address.county || null;
    const country = suggestion.address.country || null;

    if (type === 'pickup') {
      setPickup(address);
      setPickupCoords([lat, lon]);
      setPickupProvince(province);
      setPickupCountry(country);
      setPickupSuggestions([]);
      setActiveInput(null);
    } else {
      setDropoff(address);
      setDropoffCoords([lat, lon]);
      setDropoffProvince(province);
      setDropoffCountry(country);
      setDropoffSuggestions([]);
      setActiveInput(null);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setActiveInput(null); // Close any open suggestion boxes
    if (!pickupCoords) {
      setPickupCoords([lat, lng]);
      setPickup('Locating...');
      const result = await reverseGeocode(lat, lng);
      setPickup(result.address);
      setPickupProvince(result.province);
      setPickupCountry(result.country);
    } else if (!dropoffCoords) {
      setDropoffCoords([lat, lng]);
      setDropoff('Locating...');
      const result = await reverseGeocode(lat, lng);
      setDropoff(result.address);
      setDropoffProvince(result.province);
      setDropoffCountry(result.country);
    } else {
      setPickupCoords([lat, lng]);
      setPickup('Locating...');
      const result = await reverseGeocode(lat, lng);
      setPickup(result.address);
      setPickupProvince(result.province);
      setPickupCountry(result.country);
      setDropoffCoords(null);
      setDropoff('');
      setDropoffProvince(null);
      setDropoffCountry(null);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    // BUSINESS RULE: Prevent inter-island or impossible land deliveries
    if (pickupCoords && dropoffCoords) {
      const distanceKm = calculateDistanceKM(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
      
      // If distance is over 100km, it's likely inter-island or beyond land-vehicle service area
      if (distanceKm > 100) {
        setError('Delivery is outside the land-vehicle service area. Inter-island deliveries are not supported.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // GLOBAL REGION GUARD: Prevent inter-island/impossible land deliveries worldwide
      const c1 = pickupCountry || '';
      const c2 = dropoffCountry || '';
      const p1 = pickupProvince?.toLowerCase() || '';
      const p2 = dropoffProvince?.toLowerCase() || '';

      // 1. Country Check
      if (c1 !== c2) {
        setError(`International Delivery Blocked: Pickup is in ${c1} but Drop-off is in ${c2}. Land vehicles cannot cross national borders.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // 2. Strict Province/State/Region match with "Fuzzy" overlap support
      const p1 = pickupProvince?.toLowerCase() || '';
      const p2 = dropoffProvince?.toLowerCase() || '';
      
      // Check if they are actually the same or part of the same Philippine region groups
      const areRelated = (a: string, b: string) => {
        if (a === b) return true;
        if (a.includes(b) || b.includes(a)) return true;
        
        // Special Philippine region overlaps
        const groups = [
          ['cebu', 'central visayas', 'region vii'],
          ['manila', 'ncr', 'national capital region', 'rizal', 'bulacan', 'cavite', 'laguna'],
          ['davao', 'region xi'],
          ['negros', 'bacolod', 'dumaguete', 'region vi', 'region vii']
        ];
        
        return groups.some(group => 
          group.some(g => a.includes(g)) && group.some(g => b.includes(g))
        );
      };
      
      if (!areRelated(p1, p2)) {
        setError(`Service Boundary Error: You can only deliver within the same region. Pickup is in "${pickupProvince || 'Your Area'}" but Drop-off is in "${dropoffProvince || 'Your Area'}".`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

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

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl font-bold flex items-center gap-3 animate-shake relative z-20">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}

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
                      setError(null);
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
                      setError(null);
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
