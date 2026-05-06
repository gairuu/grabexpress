'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import PaymentMethodCard from '@/components/PaymentMethodCard';
import SuccessModal from '@/components/SuccessModal';
import { PaymentMethod } from '@/lib/types';

import { Delivery } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function PaymentByIdPage() {
  const router = useRouter();
  const { user, loading, resetBooking } = useApp();
  const params = useParams<{ deliveryId: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchDelivery = async () => {
      setFetching(true);
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', params.deliveryId)
        .single();

      if (fetchError || !data) {
        console.error("Payment: Delivery not found", fetchError);
        router.push('/dashboard');
        return;
      }

      setDelivery({
        id: data.id,
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        pickup_location: data.pickup_location,
        dropoff_location: data.dropoff_location,
        delivery_status: data.delivery_status,
        delivery_fee: data.delivery_fee,
        payment_method: data.payment_method,
        booking_time: data.booking_time,
        estimated_time: data.estimated_time,
      });
      setFetching(false);
    };

    fetchDelivery();
  }, [user, params.deliveryId, router, loading]);

  if (loading || fetching) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || !delivery) {
    return null;
  }

  const handlePay = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ payment_method: method })
        .eq('id', delivery.id);

      if (updateError) throw updateError;

      setIsPaid(true);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const methodLabels = {
    cash: 'Cash',
    card: 'Credit Card',
    ewallet: 'GrabPay',
  };

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-[#111827] mb-2">Checkout</h1>
          <p className="text-[#6b7280]">Complete your payment to finish the delivery.</p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest px-1">Select Payment Method</h3>
            <div className="space-y-4">
              <PaymentMethodCard method="ewallet" selected={method === 'ewallet'} onSelect={setMethod} />
              <PaymentMethodCard method="card" selected={method === 'card'} onSelect={setMethod} />
              <PaymentMethodCard method="cash" selected={method === 'cash'} onSelect={setMethod} />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-6 sticky top-24 shadow-sm">
              <h3 className="text-lg font-bold text-[#111827]">Order Summary</h3>

              <div className="space-y-4 border-b border-[#e5e7eb] pb-6 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Delivery Fee</span>
                  <span className="text-[#111827]">{formatCurrency(delivery.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Driver Tip</span>
                  <span className="text-[#111827]">₱0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="font-medium text-[#6b7280]">Total Amount</span>
                <span className="text-3xl font-black text-[var(--grab-green)]">{formatCurrency(delivery.delivery_fee)}</span>
              </div>

              <button onClick={handlePay} className="btn-primary py-4 text-lg font-bold grab-glow" disabled={isProcessing}>
                {isProcessing ? 'Saving to database...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {isPaid && (
        <SuccessModal
          amount={formatCurrency(delivery.delivery_fee)}
          method={methodLabels[method]}
          onClose={() => {
            resetBooking();
            router.push('/dashboard');
          }}
        />
      )}
    </div>
  );
}
