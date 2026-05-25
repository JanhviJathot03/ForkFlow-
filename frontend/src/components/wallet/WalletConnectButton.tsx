'use client';

import { useState } from 'react';
import { auth } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/authStore';

export function WalletConnectButton() {
  const { connectWallet, signMessage, wallet, isConnected, balance } = useWallet();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDevLoginEnabled = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true' || process.env.NODE_ENV === 'development';

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const address = await connectWallet();
      const message = `Sign this message to log in to Locus Agents. Wallet: ${address}. Timestamp: ${Date.now()}`;
      const signature = await signMessage(message);
      const response = await auth.verifyWallet({
        walletAddress: address,
        signature,
        message,
      });

      login(response.data.user ?? { id: address, walletAddress: address }, response.data.token);
    } catch (err) {
      console.error('Wallet login failed', err);
      setError('Wallet login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.register({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        message: 'dev-login',
        signature: 'dev-login',
      });

      login(response.data.user ?? { id: 'dev-user', walletAddress: response.data.walletAddress }, response.data.token);
    } catch (err) {
      console.error('Dev login failed', err);
      setError('Dev login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-white shadow-xl shadow-slate-950/40">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Wallet Access</p>
        <h2 className="mt-2 text-2xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-slate-400">Use MetaMask or a compatible wallet to sign in and activate creator features.</p>
      </div>

      {isConnected && wallet ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-950/70 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Connected</p>
            <p className="mt-1 break-all">{wallet.address}</p>
            <p className="mt-2 text-slate-400">Balance: {balance} ETH</p>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in with connected wallet'}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {isDevLoginEnabled ? (
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Dev Login (No Wallet)'}
            </button>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </>
      )}
    </div>
  );
}
