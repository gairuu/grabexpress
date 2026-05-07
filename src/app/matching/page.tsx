'use client';
import { Search, Package, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DriverCard from '@/components/DriverCard';

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(true);
  const { booking, user, loading, bookAndMatch } = useApp();
  const router = useRouter();
  const hasBooked = useRef(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [showRetry, setShowRetry] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !booking.pickup_location || hasBooked.current) return;
    hasBooked.current = true;

    const runBookingFlow = async (retries = 3) => {
      try {
        setErrorMsg('');
        setIsMatching(true);
        console.log(`[Matching] Attempting to match... (${3 - retries + 1}/3)`);
        
        // Simulated search delay for premium feel
        await new Promise(resolve => setTimeout(resolve, 3500));

        const deliveryId = await bookAndMatch({
          customer_id: user.id,
          customer_name: user.name || 'Customer',
          driver_id: '', 
          driver_name: '',
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          delivery_status: 'pending',
          delivery_fee: booking.delivery_fee,
          payment_method: booking.payment_method,
          estimated_time: '25-35 mins',
          booking_time: new Date().toISOString(),
          sender_name: booking.sender_name,
          sender_phone: booking.sender_phone,
          recipient_name: booking.recipient_name,
          recipient_phone: booking.recipient_phone,
          item_size: booking.item_size,
          item_weight: booking.item_weight,
          item_type: booking.item_type,
          vehicle_type: booking.vehicle_type,
        });

        setCreatedDeliveryId(deliveryId);
        setIsMatching(false);
      } catch (err: any) {
        console.error("Booking flow failed:", err);
        if (retries > 1) {
          console.log("[Matching] Retrying in 5s...");
          setTimeout(() => runBookingFlow(retries - 1), 5000);
        } else {
          setErrorMsg(err.message || "No drivers found. Please ensure a driver is online and try again.");
          setShowRetry(true);
          setIsMatching(false);
        }
      }
    };

    runBookingFlow();
  }, [user, booking, loading, bookAndMatch]);

  const handleStart = () => {
    if (!createdDeliveryId) return;
    setIsStarting(true);
    router.push(`/tracking/${createdDeliveryId}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {isMatching || errorMsg ? (
          <div className="space-y-12">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center z-10 relative text-white ${errorMsg ? 'bg-red-500' : 'bg-[#00B14F]'}`}>
                <Search size={48} strokeWidth={3} />
              </div>
              {!errorMsg && (
                <>
                  <div className="absolute inset-0 ripple rounded-full"></div>
                  <div className="absolute inset-0 ripple-delay-1 rounded-full"></div>
                  <div className="absolute inset-0 ripple-delay-2 rounded-full"></div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h1 className={`text-3xl font-extrabold ${errorMsg ? 'text-red-500' : 'text-[#111827]'}`}>
                {errorMsg ? "Matching Failed" : "Finding your driver..."}
              </h1>
              <p className="max-w-sm mx-auto text-[#6b7280]">
                {errorMsg ? errorMsg : "We're matching you with the nearest available GrabExpress driver in your area."}
              </p>
            </div>

            <div className="max-w-sm mx-auto flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#00B14F]">
                <Package size={24} />
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-widest text-[#9ca3af]">Routing</div>
                <div className="w-48 truncate text-sm font-semibold text-[#111827]">{booking.pickup_location} → {booking.dropoff_location}</div>
              </div>
            </div>

            {showRetry && (
              <div className="pt-8 flex flex-col gap-4 fade-in">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 bg-white border border-[#e5e7eb] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                >
                  Still searching... Try again?
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8 fade-in">
            <div className="space-y-2">
              <div className="mb-4 flex justify-center text-[#00B14F]">
                <CheckCircle2 size={64} strokeWidth={1} />
              </div>
              <h1 className="text-3xl font-extrabold text-[#111827]">Driver Found!</h1>
              <p className="text-[#6b7280]">Your driver is on the way to pick up your package.</p>
            </div>

            {booking.driver && <DriverCard driver={booking.driver} />}

            <div className="pt-4">
              {errorMsg && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
                  ⚠️ {errorMsg}
                </div>
              )}
              <button
                onClick={handleStart}
                disabled={isStarting}
                className={`btn-primary py-4 text-lg font-bold grab-glow ${isStarting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isStarting ? 'Starting delivery...' : 'Confirm & Start Delivery'}
              </button>
              <button onClick={() => router.push('/book')} className="btn-ghost mt-4 border-none text-red-400 hover:bg-red-400/10">
                Cancel Booking
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
