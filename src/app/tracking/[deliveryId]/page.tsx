'use client';
import { Flag, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DriverCard from '@/components/DriverCard';
import StatusTimeline from '@/components/StatusTimeline';
import Map from '@/components/Map';
import ChatBox from '@/components/ChatBox';
import { DeliveryStatus, Delivery } from '@/lib/types';
import { supabase } from '@/lib/supabase';

function parseOrMockCoords(location: string, defaultOffset: number = 0): [number, number] {
  if (!location) return [14.5995 + defaultOffset, 120.9842 + defaultOffset];
  const match = location.match(/Lat: ([-\d.]+), Lng: ([-\d.]+)/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  let hash = 0;
  for (let i = 0; i < location.length; i++) hash = location.charCodeAt(i) + ((hash << 5) - hash);
  const latOffset = (hash % 100) / 10000;
  const lngOffset = ((hash >> 4) % 100) / 10000;
  return [14.5995 + defaultOffset + latOffset, 120.9842 + defaultOffset + lngOffset];
}

export default function TrackingByIdPage() {
  const { booking, user, loading } = useApp();
  const params = useParams<{ deliveryId: string }>();
  const router = useRouter();
  
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchCurrentStatus = async () => {
    if (!params.deliveryId) return;
    
    setLoadError(null);
    console.log(`[Tracking] Fetching status for: ${params.deliveryId}`);
    
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', params.deliveryId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        console.log('[Tracking] Data received:', data.delivery_status);
        const mapped: Delivery = {
          id: data.id,
          customer_id: data.customer_id,
          customer_name: data.customer_name,
          driver_id: data.driver_id || '',
          driver_name: data.driver_name || '',
          pickup_location: data.pickup_location,
          dropoff_location: data.dropoff_location,
          delivery_status: data.delivery_status as DeliveryStatus,
          delivery_fee: data.delivery_fee,
          payment_method: data.payment_method,
          estimated_time: data.estimated_time,
          booking_time: data.booking_time,
          sender_name: data.sender_name,
          sender_phone: data.sender_phone,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          item_size: data.item_size,
          item_weight: data.item_weight,
          item_type: data.item_type,
          vehicle_type: data.vehicle_type,
        };
        setDelivery(mapped);
        hasFetchedRef.current = true;
      } else {
        console.warn("[Tracking] Delivery not found:", params.deliveryId);
        setLoadError("Delivery record not found.");
      }
    } catch (err: any) {
      console.error("[Tracking] Error fetching status:", err);
      setLoadError(err.message || "Failed to connect to database.");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!params.deliveryId) return;
    
    const timeout = setTimeout(() => {
      if (!hasFetchedRef.current) {
        console.warn("[Tracking] Verification timed out — falling back to booking context.");
        setIsVerifying(false);
      }
    }, 6000);

    fetchCurrentStatus();

    const channel = supabase
      .channel(`delivery-${params.deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${params.deliveryId}`,
        },
        (payload) => {
          console.log('[Tracking] Real-time update received:', payload.new.delivery_status);
          const data = payload.new;
          const mapped: Delivery = {
            id: data.id,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            driver_id: data.driver_id || '',
            driver_name: data.driver_name || '',
            pickup_location: data.pickup_location,
            dropoff_location: data.dropoff_location,
            delivery_status: data.delivery_status as DeliveryStatus,
            delivery_fee: data.delivery_fee,
            payment_method: data.payment_method,
            estimated_time: data.estimated_time,
            booking_time: data.booking_time,
            sender_name: data.sender_name,
            sender_phone: data.sender_phone,
            recipient_name: data.recipient_name,
            recipient_phone: data.recipient_phone,
            item_size: data.item_size,
            item_weight: data.item_weight,
            item_type: data.item_type,
            vehicle_type: data.vehicle_type,
          };
          setDelivery(mapped);
          setIsVerifying(false);
          setLoadError(null);
        }
      )
      .subscribe((status) => {
        console.log(`[Tracking] Subscription status: ${status}`);
      });

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [params.deliveryId]);

  const realStatus = delivery?.delivery_status || booking.delivery_status || 'pending';
  const displayDriver = delivery?.driver_id ? {
    id: delivery.driver_id,
    name: delivery.driver_name,
    avatar: (delivery.driver_name || 'DR').slice(0, 2).toUpperCase(),
    vehicle: delivery.vehicle_type || 'Motorcycle',
    rating: 5.0,
    totalDeliveries: 0,
    status: 'busy',
    contact_number: (delivery as any).driver_contact || '',
  } : booking.driver;

  const [progress, setProgress] = useState(0);
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([14.5995, 120.9842]);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>([14.6195, 120.9842]);
  
  const pickupStr = delivery?.pickup_location || booking.pickup_location;
  const dropoffStr = delivery?.dropoff_location || booking.dropoff_location;

  useEffect(() => {
    const forwardGeocode = async (address: string): Promise<[number, number] | null> => {
      if (!address || address.length < 3) return null;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (e) {
        console.warn('Forward geocoding failed', e);
      }
      return null;
    };

    const loadCoords = async () => {
      if (pickupStr) {
        const coords = await forwardGeocode(pickupStr);
        setPickupCoords(coords || parseOrMockCoords(pickupStr, 0));
      }
      if (dropoffStr) {
        const coords = await forwardGeocode(dropoffStr);
        setDropoffCoords(coords || parseOrMockCoords(dropoffStr, 0.02));
      }
    };
    loadCoords();
  }, [pickupStr, dropoffStr]);
  
  useEffect(() => {
    if (realStatus === 'in_transit') {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + 1));
      }, 200);
      return () => clearInterval(interval);
    } else if (realStatus === 'delivered') {
      setProgress(100);
    }
  }, [realStatus]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00B14F]"></div>
        <div className="text-[#6b7280] font-medium">Verifying delivery status...</div>
      </div>
    );
  }

  if (loadError && !delivery) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Flag size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Tracking Unreachable</h2>
          <p className="text-[#6b7280] mb-8">{loadError}</p>
          <div className="space-y-4">
            <button 
              onClick={() => { hasFetchedRef.current = false; setIsVerifying(true); fetchCurrentStatus(); }}
              className="w-full btn-primary py-3 font-bold"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth');
    return null;
  }

  const driverLat = pickupCoords[0] + (dropoffCoords[0] - pickupCoords[0]) * (progress / 100);
  const driverLng = pickupCoords[1] + (dropoffCoords[1] - pickupCoords[1]) * (progress / 100);
  const driverCoords: [number, number] = [driverLat, driverLng];

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10">
        <header className="mb-10 text-center relative">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Delivery in Progress</h1>
          <p className="text-[#6b7280]">Real-time status updates for your package.</p>
          <button 
            onClick={fetchCurrentStatus}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-[#00B14F] transition-colors"
            title="Manual Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#111827] mb-8">Tracking Details</h3>
              <StatusTimeline currentStatus={realStatus} />
              
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
                  {realStatus === 'in_transit' && progress >= 85 && (
                    <p className="mt-3 text-xs text-center text-[#9ca3af] font-medium animate-pulse">
                      ⏳ Awaiting driver delivery confirmation...
                    </p>
                  )}
                </div>
              )}

              {realStatus === 'delivered' && (
                <div className="mt-10 p-6 bg-[#00B14F]/10 border border-[#00B14F]/30 rounded-2xl fade-in">
                  <div className="flex items-center gap-4">
                    <div className="text-[#00B14F] animate-bounce">
                      <Flag size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#111827]">Package Delivered!</h4>
                      <p className="text-sm text-[#6b7280]">Your package has arrived at its destination.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Map Integration */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden h-[400px] flex flex-col">
              <div className="p-4 border-b border-[#e5e7eb] bg-gray-50">
                <span className="text-sm font-bold text-[#111827]">Live Map Tracker</span>
              </div>
              <div className="flex-1 w-full h-full relative z-0">
                <Map 
                  pickup={pickupCoords} 
                  dropoff={dropoffCoords} 
                  driver={realStatus === 'pending' ? null : driverCoords} 
                  interactive={true} 
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest px-1">Your Driver</h3>
              {displayDriver && <DriverCard driver={displayDriver as any} compact />}
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest">Route Summary</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#00B14F] mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="text-[10px] text-[#9ca3af] uppercase font-bold">Pickup</div>
                    <div className="text-sm text-[#111827] font-medium">{pickupStr}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded bg-red-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="text-[10px] text-[#9ca3af] uppercase font-bold">Drop-off</div>
                    <div className="text-sm text-[#111827] font-medium">{dropoffStr}</div>
                  </div>
                </div>
              </div>
            </div>

            {realStatus === 'delivered' && (
              <button
                onClick={() => router.push(`/payment/${params.deliveryId}`)}
                className="btn-primary py-4 text-lg font-bold grab-glow w-full fade-in"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </div>

        {delivery && (
          <ChatBox 
            deliveryId={delivery.id} 
            recipientName={delivery.driver_name} 
          />
        )}
      </main>
    </div>
  );
}
