'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ChevronDown, Globe } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      // Use hard redirect to ensure session is completely cleared
      window.location.href = '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#003d2b] border-b border-white/10">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 no-underline group">
            <img src="/logo.png" alt="GrabExpress Logo" className="h-8 w-auto brightness-0 invert" />
            <span className="text-xl font-bold tracking-tight text-white group-hover:opacity-80 transition-opacity">
              GrabExpress
            </span>
          </Link>

          {user && (
            <div className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex">
              <Link href={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/dashboard'} className="transition hover:text-white">
                Home
              </Link>
              {user.role === 'customer' && (
                <Link href="/book" className="transition hover:text-white">
                  Book
                </Link>
              )}
              {user.role === 'driver' && (
                <Link href="/driver" className="transition hover:text-white">
                  My Deliveries
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin" className="transition hover:text-white">
                  Admin Panel
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Country Selector - matching screenshot */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition cursor-pointer">
            <img src="https://flagcdn.com/w20/ph.png" alt="Philippines" className="w-5 h-3.5 object-cover rounded-sm" />
            <span className="text-sm font-semibold text-white">Philippines</span>
            <ChevronDown size={14} className="text-white/60" />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00B14F] text-[11px] font-bold text-white">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-semibold text-white">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 border-l border-white/20 pl-2">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold text-white/70 transition hover:text-white hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth">
                <button className="rounded-full bg-[#00B14F] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#009940] shadow-lg shadow-[#00B14F]/20">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
