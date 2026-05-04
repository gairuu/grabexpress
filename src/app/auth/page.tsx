'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';

export default function AuthPage() {
  const { signInWithGoogle, user, loading } = useApp();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl border border-white text-center">
          <div className="mb-10">
            <div className="w-20 h-20 bg-[#00B14F]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
              <div className="transform -rotate-12">
                <svg viewBox="0 0 24 24" width="40" height="40" className="text-[#00B14F]">
                  <path fill="currentColor" d="M21.5,12a9.5,9.5,0,1,1-9.5-9.5A9.51,9.51,0,0,1,21.5,12Z" opacity="0.2"/>
                  <path fill="currentColor" d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20Z"/>
                  <path fill="currentColor" d="M12.5,7H11v6l5.25,3.15.75-1.23-4.5-2.67Z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-black text-[#111827] tracking-tight">
              Welcome to GrabExpress
            </h2>
            <p className="text-[#6b7280] mt-4 font-medium text-lg leading-relaxed">
              The fastest way to send and receive items in your city.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-[#e5e7eb] py-4 rounded-2xl font-bold text-lg text-[#111827] hover:border-[#00B14F] hover:bg-[#f0fdf4] transition-all shadow-sm active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-[11px] text-[#9ca3af] px-6 leading-normal font-medium">
              By continuing, you agree to our <span className="text-[#6b7280] underline cursor-pointer">Terms of Service</span> and <span className="text-[#6b7280] underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
