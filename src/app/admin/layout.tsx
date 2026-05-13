'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <Navbar />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <aside className="w-full md:w-64 p-6 space-y-2">
          <nav className="space-y-1">
            <a href="/admin" className="flex items-center px-4 py-3 text-sm font-bold text-[#00B14F] bg-white rounded-xl shadow-sm">
              Dashboard Overview
            </a>
            <a href="/admin/drivers" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-white hover:text-[#00B14F] rounded-xl transition-all">
              Manage Drivers
            </a>
            <a href="/admin/customers" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-white hover:text-[#00B14F] rounded-xl transition-all">
              Manage Customers
            </a>
            <a href="/admin/deliveries" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-white hover:text-[#00B14F] rounded-xl transition-all">
              All Deliveries
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
