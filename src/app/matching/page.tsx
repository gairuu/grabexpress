'use client';
import { Search, Package, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import DriverCard from '@/components/DriverCard';

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(true);
  const { booking, setBooking, user, loading, addDelivery, findAvailableDriver } = useApp();
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [showRetry, setShowRetry] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!booking.pickup) {
      router.push('/book');
      return;
    }

    const matchDriver = async () => {
      try {
        const driver = await findAvailableDriver();
        if (driver) {
          setBooking({ driver });
          setIsMatching(false);
        } else {
          // Handle case where no drivers are available
          setErrorMsg("No available drivers right now! Please ensure you have run the mock-drivers script in Supabase.");
          setShowRetry(true);
        }
      } catch (err) {
        console.error("Error matching driver:", err);
        setErrorMsg("Error finding a driver. Please check your connection.");
        setShowRetry(true);
      }
    };

    const timer = setTimeout(() => {
      matchDriver();
    }, 3500);

    // Show retry button if it takes too long
    const retryTimer = setTimeout(() => {
      if (isMatching) setShowRetry(true);
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearTimeout(retryTimer);
    };
  }, [booking.pickup, router, setBooking, loading, findAvailableDriver, isMatching]);

  const handleStart = async () => {
    if (isStarting || !booking.driver) return;
    
    setIsStarting(true);
    setErrorMsg('');

    // Safety timeout: reset button if it takes more than 10 seconds
    const safetyTimeout = setTimeout(() => {
      setIsStarting(false);
      setErrorMsg("Starting the delivery is taking longer than expected. Please check your connection.");
    }, 12000);

    try {
      const deliveryId = await addDelivery({
        customerId: user?.id || '',
        customerName: user?.name || 'Customer',
        driverId: booking.driver.id,
        driverName: booking.driver.name,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        status: 'pending',
        fee: booking.fee,
        paymentMethod: booking.paymentMethod,
        estimatedTime: '25-35 mins',
        senderName: booking.senderName,
        senderPhone: booking.senderPhone,
        recipientName: booking.recipientName,
        recipientPhone: booking.recipientPhone,
        itemSize: booking.itemSize,
        itemWeight: booking.itemWeight,
        itemType: booking.itemType,
        vehicleType: booking.vehicleType,
      });

      clearTimeout(safetyTimeout);
      router.push(`/tracking/${deliveryId}`);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('Start delivery error:', err);
      setIsStarting(false);
      setErrorMsg(err.message || 'Failed to start delivery. Please try again.');
    }
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
                <div className="w-48 truncate text-sm font-semibold text-[#111827]">{booking.pickup} → {booking.dropoff}</div>
              </div>
            </div>

            {showRetry && (
              <div className="pt-8 fade-in">
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
