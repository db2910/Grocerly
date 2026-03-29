'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Login failed', { description: error.message });
        setIsLoading(false);
        return;
      }

      toast.success('Logged in successfully');
      router.push('/admin/dashboard');
      router.refresh(); // Force refresh to ensure middleware catches the session
    } catch (err) {
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* ── Left Side: Login Form ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        
        {/* Logo - Centered above the form */}
        <div className="mb-12 flex flex-col items-center">
          <Link href="/" className="group transition-transform hover:scale-105">
            <Image
              src="/logo.jpeg"
              alt="Grocerly Logo"
              width={80}
              height={80}
              className="rounded-full object-cover border-4 border-white shadow-lg"
            />
          </Link>
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Admin Login
            </h1>
            <p className="mt-2 text-sm font-semibold text-primary uppercase tracking-wider">
              Admin access only
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-10">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 text-base outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400"
                placeholder="admin@grocerly.rw"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-primary hover:underline transition-all">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 pr-14 text-base outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group w-fit ml-1">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-primary checked:bg-primary"
                />
                <span className="material-symbols-outlined absolute text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none text-sm font-bold">
                  check
                </span>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                Remember me
              </span>
            </label>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">shield_person</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Simple footer for the card */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link href="/" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">
              ← Return to public site
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right Side: Branding Visual Panel ──────────────────── */}
      <div className="hidden lg:flex relative w-[40%] xl:w-[45%] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1753354868504-db68f35d3b90?q=80&w=2000&auto=format&fit=crop"
          alt="Person with shopping cart"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 hover:scale-105"
        />
        
        {/* Subtle Brand Overlay - for depth and contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/5" />

        {/* Branding Content */}
        <div className="relative z-10 flex h-full flex-col justify-end p-16 xl:p-24 text-white">
          <div className="max-w-md">
            <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h2 className="text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
              Manage Grocerly Orders
            </h2>
            <p className="mt-6 text-xl font-medium text-white/90 leading-relaxed drop-shadow-md">
              Track orders, manage products, and keep Grocerly running smoothly.
            </p>
            
            {/* Quick stats for visual interest */}
            <div className="mt-12 flex items-center gap-10 border-t border-white/20 pt-10">
              <div>
                <p className="text-3xl font-black">24/7</p>
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">Support</p>
              </div>
              <div>
                <p className="text-3xl font-black">100%</p>
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">Secure</p>
              </div>
              <div>
                <p className="text-3xl font-black">Fast</p>
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">Dashboard</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
