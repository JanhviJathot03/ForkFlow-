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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Locus Agents</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
              Sign in to access the AI agent marketplace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Use your email or connect your wallet to sign in, create agents, buy and trade on the marketplace.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">1. Sign In</p>
                <p className="mt-2 font-medium">Email or Wallet</p>
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
            <div className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLoginMode('email')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    loginMode === 'email'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setLoginMode('wallet')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    loginMode === 'wallet'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Wallet
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                        placeholder="••••••••"
                      />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
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
