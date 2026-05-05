'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, Truck, CheckCircle2 } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

export default function DriverDashboardPage() {
  const { user, loading, deliveries, updateDeliveryStatus } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
    } else if (user.role !== 'driver') {
      router.push('/dashboard');
    }

    // Refresh deliveries every 3 seconds to catch new jobs
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 3000);

    return () => clearInterval(interval);
  }, [user, router, loading, fetchDeliveries]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f5f7] flex items-center justify-center"><div className="text-[#6b7280]">Loading...</div></div>;
  }

  if (!user || user.role !== 'driver') {
    return null;
  }

  const myJobs = deliveries;

  const stats = {
    pending: myJobs.filter((job) => job.status === 'pending').length,
    active: myJobs.filter((job) => job.status === 'in_transit').length,
    completed: myJobs.filter((job) => job.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Driver Dashboard</h1>
            <p className="text-sm text-[#6b7280]">Manage assigned deliveries and update progress in real time.</p>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard icon={Clock} label="Pending Pickups" value={stats.pending} />
          <StatsCard icon={Truck} label="In Transit" value={stats.active} color="#3B82F6" />
          <StatsCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#00B14F" />
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">Assigned Deliveries</h2>
          </div>

          <div className="divide-y divide-[#e5e7eb]">
            {myJobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#9ca3af]">
                No assigned deliveries yet. Deliveries will appear here when customers assign you as their driver.
              </div>
            ) : (
              myJobs.map((job) => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="font-mono text-xs text-[#9ca3af]">#{job.id.slice(0, 8).toUpperCase()}</span>
                        <StatusBadge status={job.status} size="sm" />
                      </div>
                      <div className="text-sm font-medium text-[#111827]">
                        {job.pickup} &rarr; {job.dropoff}
                      </div>
                      <div className="mt-1 text-xs text-[#6b7280]">
                        Customer: {job.customerName} · {formatDate(job.createdAt)} · {formatCurrency(job.fee)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'pending' && (
                        <button
                          className="rounded-md bg-[#00B14F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#009940]"
                          onClick={() => updateDeliveryStatus(job.id, 'in_transit')}
                        >
                          Start Delivery
                        </button>
                      )}
                      {job.status === 'in_transit' && (
                        <button
                          className="rounded-md bg-[var(--grab-green)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--grab-green-dark)]"
                          onClick={() => updateDeliveryStatus(job.id, 'delivered')}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
