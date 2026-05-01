'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import { AppUser } from '@/lib/types';
import { Mail, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<AppUser['role']>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signUp, signIn, signInWithGoogle, user, loading } = useApp();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
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
          return;
        }
      } else {
        const result = await signUp(email, password, name, role);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        // If sign up success and email verification is on, show message
        setVerificationSent(true);
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl text-center border border-white">
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
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-white">
          <div className="mb-8 flex rounded-xl bg-[#f3f4f6] p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 rounded-lg py-3 font-bold text-sm transition-all ${isLogin ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280]'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 rounded-lg py-3 font-bold text-sm transition-all ${!isLogin ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280]'}`}
            >
              Register
            </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#111827]">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#9ca3af] mt-2 font-medium">
              {isLogin ? 'Log in to manage your deliveries' : 'Join the fastest delivery network'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-600 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9ca3af]">Role</label>
                <select
                  className="grab-input bg-[#f9fafb] border-transparent focus:bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppUser['role'])}
                >
                  <option value="customer">Customer (Send Items)</option>
                  <option value="driver">Driver (Deliver Items)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9ca3af]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gabriel Borces"
                  className="grab-input bg-[#f9fafb] border-transparent focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9ca3af]">Email Address</label>
              <input
                type="email"
                placeholder="name@email.com"
                className="grab-input bg-[#f9fafb] border-transparent focus:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9ca3af]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="grab-input bg-[#f9fafb] border-transparent focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00B14F] hover:bg-[#009940] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#00B14F]/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5e7eb]"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-[#9ca3af] font-bold">Or continue with</span></div>
              </div>

              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 border border-[#e5e7eb] py-3.5 rounded-xl font-bold text-sm text-[#111827] hover:bg-[#f9fafb] transition-all"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Login with Google
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm font-medium text-[#9ca3af]">
            {isLogin ? "New to GrabExpress? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[#00B14F] font-bold hover:underline ml-1"
            >
              {isLogin ? 'Register now' : 'Sign in here'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
