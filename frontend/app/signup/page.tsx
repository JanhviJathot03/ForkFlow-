'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.register({
        email,
        username,
        password,
        walletAddress: `email_${email}`,
        message: 'signup',
        signature: 'email_auth',
      });

      login(response.data.user ?? { id: response.data.id, walletAddress: `email_${email}` }, response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup failed', err);
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
              Sign up to create and trade AI agents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Create an account with email or connect your wallet to start building, buying, and selling AI agents on the marketplace.
            </p>
          </section>

          <aside className="flex items-center">
            <form onSubmit={handleSignup} className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-6">Create Account</h2>

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
                <label className="block text-sm font-semibold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  placeholder="your_username"
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
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>

              <div className="text-center text-sm">
                <p className="text-slate-400">
                  Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
                </p>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
