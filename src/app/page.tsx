'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import { Info, ArrowRight, Bike, Box, MapPin, LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
  const { user } = useApp();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Main Hero Container - matching the screenshot's green background */}
        <div className="w-full bg-[#003d2b] pt-8 pb-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            
            {/* White Hero Box */}
            <div className="overflow-hidden rounded-sm bg-white shadow-2xl flex flex-col md:flex-row min-h-[440px]">
              {/* Content centered since image is removed */}
              <div className="flex-1 p-10 md:p-16 flex flex-col justify-center items-center text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-[#111827] leading-tight mb-12 max-w-2xl">
                  Plan, manage and track your deliveries with GrabExpress Web
                </h1>

                <div className="space-y-6 w-full max-w-md">
                  <div className="flex items-center justify-center gap-2 text-lg font-semibold text-[#111827]">
                    Track your delivery <Info size={16} className="text-[#6b7280]" />
                  </div>

                  <div className="flex w-full overflow-hidden rounded-full border border-[#e5e7eb] bg-[#f3f5f7] p-1.5 focus-within:border-[#00B14F] transition-colors">
                    <input 
                      type="text" 
                      placeholder="Enter order ID to track" 
                      className="flex-1 bg-transparent px-6 py-2 text-sm outline-none text-[#111827]"
                    />
                    <button className="rounded-full bg-[#0d1b2a] px-8 py-2.5 text-sm font-bold text-white hover:bg-black transition-colors">
                      Track
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Bars */}
            <div className="mt-8 space-y-2">
              {!user ? (
                <>
                  <Link href="/auth" className="block w-full">
                    <div className="w-full bg-[#002b1f] hover:bg-[#002419] py-4 px-8 text-white font-semibold text-sm flex justify-between items-center transition-colors group">
                      Login with Mobile Number
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </Link>
                  <Link href="/auth" className="block w-full">
                    <div className="w-full bg-[#00B14F] hover:bg-[#009940] py-4 px-8 text-white font-semibold text-sm flex justify-between items-center transition-colors group">
                      Login with Grab for Business account
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </Link>
                </>
              ) : (
                <Link href={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/dashboard'} className="block w-full">
                  <div className="w-full bg-[#00B14F] hover:bg-[#009940] py-5 px-8 text-white font-bold text-lg flex justify-between items-center transition-all group shadow-lg shadow-black/20">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={24} />
                      Go to your {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                    </div>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-12">
              Different services for all your delivery needs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'GrabExpress Instant', desc: 'Fast and secure delivery within hours.', icon: Bike },
                { title: 'GrabExpress Same Day', desc: 'Affordable delivery within the same day.', icon: Box },
                { title: 'GrabExpress Multi-stop', desc: 'Send to multiple addresses in one booking.', icon: MapPin }
              ].map((service, i) => (
                <div key={i} className="group p-8 rounded-2xl border border-[#e5e7eb] hover:border-[#00B14F] hover:shadow-xl transition-all cursor-pointer">
                  <div className="text-[#00B14F] mb-6">
                    <service.icon size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-3">{service.title}</h3>
                  <p className="text-[#6b7280] leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f3f5f7] py-12 px-6 border-t border-[#e5e7eb]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Grab" className="h-6 w-auto grayscale opacity-50" />
            <span className="text-sm font-bold text-[#9ca3af]">GrabExpress Web</span>
          </div>
          <div className="text-sm text-[#9ca3af]">
            &copy; {new Date().getFullYear()} GrabExpress Simulation. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-[#9ca3af]">
            <a href="#" className="hover:text-[#6b7280]">Privacy Policy</a>
            <a href="#" className="hover:text-[#6b7280]">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
