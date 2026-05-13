'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import { AppUser } from '@/lib/types';
import { Mail, ArrowRight, User, Bike, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<AppUser['role']>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Driver specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');

  const { signUp, signIn, signInWithGoogle, user, loading } = useApp();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'driver') router.push('/driver');
      else router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
        }
        // Don't setIsSubmitting(false) on success — keep the spinner 
        // while useEffect waits for the user state to update and redirect
      } else {
        const driverDetails = role === 'driver' ? {
          licenseNumber,
          plateNumber,
          vehicleType
        } : undefined;
        
        const result = await signUp(email, password, name, role, driverDetails);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }

        // Only show verification screen for real gmails (not admin@gmail.com)
        const isAdminEmail = email.toLowerCase() === 'admin@gmail.com';
        const isRealGmail = email.toLowerCase().endsWith('@gmail.com') && !isAdminEmail;
        
        if (isRealGmail) {
          setVerificationSent(true);
          setIsSubmitting(false);
        }
        // For all other accounts, keep spinner and let useEffect handle redirect
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl text-center border border-[#e5e7eb]">
            <div className="w-20 h-20 bg-[#00B14F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-[#00B14F]" size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#111827] mb-4">Check your email</h2>
            <p className="text-[#6b7280] mb-8 leading-relaxed">
              We've sent a verification link to <span className="font-bold text-[#111827]">{email}</span>. 
              Please click the link to activate your account.
            </p>
            <button 
              onClick={() => { setVerificationSent(false); setIsLogin(true); }}
              className="w-full btn-primary py-4"
            >
              Back to Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-[#e5e7eb]">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-[#6b7280] mt-2 font-medium">
              {isLogin ? 'Enter your details to access your account.' : 'Join GrabExpress today.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">I am registering as a:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === 'customer' ? 'border-[#00B14F] bg-[#00B14F]/5 text-[#00B14F]' : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]'}`}
                    >
                      <User size={20} />
                      <span className="text-xs font-bold">Customer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === 'driver' ? 'border-[#FBBF24] bg-[#FBBF24]/5 text-[#FBBF24]' : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]'}`}
                    >
                      <Bike size={20} />
                      <span className="text-xs font-bold">Driver</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="grab-input w-full bg-[#f9fafb]"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                {role === 'driver' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">License Number</label>
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="grab-input w-full bg-[#f9fafb]"
                        placeholder="N01-XX-XXXXXX"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Plate Number</label>
                        <input
                          type="text"
                          required
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value)}
                          className="grab-input w-full bg-[#f9fafb]"
                          placeholder="ABC 1234"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Vehicle Type</label>
                        <select 
                          className="grab-input w-full bg-[#f9fafb]"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                        >
                          <option value="Motorcycle">Motorcycle</option>
                          <option value="Car">Car</option>
                          <option value="Van">Van</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="grab-input w-full bg-[#f9fafb]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="grab-input w-full bg-[#f9fafb]"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Log In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-[#e5e7eb]"></div>
            <span className="mx-4 text-xs font-bold text-[#9ca3af] uppercase tracking-widest">Or</span>
            <div className="flex-1 border-t border-[#e5e7eb]"></div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('grab_signup_role', role);
              signInWithGoogle();
            }}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#e5e7eb] py-3.5 rounded-xl font-bold text-sm text-[#111827] hover:border-[#00B14F] hover:bg-[#f0fdf4] transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm font-medium text-[#6b7280]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[#00B14F] hover:underline font-bold"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
