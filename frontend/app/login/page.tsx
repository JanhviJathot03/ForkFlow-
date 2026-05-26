'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'email' | 'wallet'>('email');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.login({
        email,
        password,
      });

      login(response.data.user ?? { id: response.data.id, walletAddress: `email_${email}` }, response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="liquid-glass rounded-[2rem] p-10 shadow-2xl shadow-black/30">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">ForkFlow</p>
            <h1 className="mt-4 max-w-2xl font-heading italic text-5xl leading-tight tracking-[-2px]">
              Sign in to access the agent marketplace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Use your email to sign in, create agents, buy and trade on the marketplace.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">1. Sign In</p>
                <p className="mt-2 font-medium">Email </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">2. Explore</p>
                <p className="mt-2 font-medium">Browse agents</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">3. Create</p>
                <p className="mt-2 font-medium">Build & earn</p>
              </div>
            </div>
          </section>

          <aside className="flex items-center">
            <div className="w-full liquid-glass rounded-[1.25rem] p-6 space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLoginMode('email')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    loginMode === 'email'
                      ? 'liquid-glass-strong text-white'
                      : 'liquid-glass text-white/80 hover:text-white'
                  }`}
                >
                  Email
                </button>
              
              </div>

              {loginMode === 'email' ? (
                <>
                  <h2 className="text-xl font-semibold">Sign In</h2>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full liquid-glass rounded-full px-4 py-2 text-white placeholder:text-white/50 outline-none"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full liquid-glass rounded-full px-4 py-2 text-white placeholder:text-white/50 outline-none"
                        placeholder="••••••••"
                      />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full liquid-glass-strong text-white font-semibold py-2 rounded-full transition disabled:opacity-60"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="text-center text-sm">
                    <p className="text-slate-400">
                      Don't have an account? <Link href="/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
                  <WalletConnectButton />
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
