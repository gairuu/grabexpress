'use client';
import { useState, useEffect } from 'react';
import { MapPin, X, Check, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

interface Props {
  delivery: any;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingJobModal({ delivery, onAccept, onReject }: Props) {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden slide-up">
        <div className="bg-[var(--grab-green)] p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-black">New Request!</h2>
          <p className="text-white/80 font-bold mt-1 uppercase tracking-wider text-xs">Accept within {timeLeft}s</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="w-0.5 flex-1 border-l-2 border-dotted border-gray-200 my-1"></div>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup</p>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{delivery.pickup_location}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Drop-off</p>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{delivery.dropoff_location}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <span className="text-sm font-bold text-gray-500">Estimated Fare</span>
            <span className="text-xl font-black text-[var(--grab-green)]">{formatCurrency(delivery.delivery_fee)}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onReject}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors"
            >
              Decline
            </button>
            <button 
              onClick={onAccept}
              className="flex-2 py-4 px-8 rounded-2xl bg-[var(--grab-green)] text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
