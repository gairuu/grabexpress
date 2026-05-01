'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function TrackingPage() {
  const { booking, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!booking.id || !booking.driver) {
      router.push('/book');
      return;
    }
    router.replace(`/tracking/${booking.id}`);
  }, [booking.id, booking.driver, router]);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth');
  }

  return null;
}
