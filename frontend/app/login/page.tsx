'use client';

import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Locus Agents</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
              Sign in with your wallet to create, buy, and fork AI agents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              This is the Web3 entry point for the marketplace. The wallet signature becomes the user identity for publishing agents, receiving royalties, and starting Locus payments.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">1. Connect</p>
                <p className="mt-2 font-medium">Open MetaMask</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">2. Sign</p>
                <p className="mt-2 font-medium">Verify ownership</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">3. Build</p>
                <p className="mt-2 font-medium">Publish agents</p>
              </div>
            </div>
          </section>

          <aside className="flex items-start">
            <WalletConnectButton />
          </aside>
        </div>
      </div>
    </div>
  );
}
